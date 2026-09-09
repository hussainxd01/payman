"use client";

import { useEffect, useState } from "react";
import api from "@/lib/apiClient";
import { parseVoucherText } from "@/lib/parsers/voucherParser";

import PasteVoucher from "@/components/home/PasteVoucher";
import AddMoreVouchers from "@/components/vouchers/AddMoreVouchers";
import ImportPreview from "@/components/vouchers/ImportPreview";
import VoucherList from "@/components/vouchers/VoucherList";
import VoucherEditor from "@/components/vouchers/VoucherEditor";
import Report from "@/components/report/Report";
import OutstandingPage from "@/components/report/OutstandingPage";
import ExpenseList from "@/components/expenses/ExpenseList";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { LoadingState, ErrorState } from "@/components/ui/Shared";

// home -> preview -> list -> processing -> report -> outstanding
//                                        -> all-vouchers -> edit-voucher
//                                        -> expenses
// add-more (reachable from list / all-vouchers / report) -> preview -> back to origin
export default function Home() {
  const [view, setView] = useState("loading");
  const [batch, setBatch] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [banks, setBanks] = useState([]);
  const [report, setReport] = useState(null);
  const [expenses, setExpenses] = useState([]);

  const [parsed, setParsed] = useState(null);
  const [addMoreReturnView, setAddMoreReturnView] = useState(null);
  const [processingIndex, setProcessingIndex] = useState(0);
  const [editingVoucher, setEditingVoucher] = useState(null);
  // A snapshot of the outstanding list taken when the Outstanding page is
  // opened. While this is set, saving a voucher opens the next one in
  // THIS list instead of bouncing to the report or all-vouchers.
  const [outstandingQueue, setOutstandingQueue] = useState(null);

  const [saving, setSaving] = useState(false);
  const [savingQuantity, setSavingQuantity] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");

  // ---- Bootstrap: resume an active batch if one exists ----
  useEffect(() => {
    bootstrap();
    api
      .listBanks()
      .then((r) => setBanks(r.banks))
      .catch(() => {});
  }, []);

  async function loadReport(batchId) {
    const [{ report }, { expenses: e }] = await Promise.all([
      api.getReport(batchId),
      api.listExpenses(batchId),
    ]);
    setReport(report);
    setExpenses(e);
  }

  async function bootstrap() {
    try {
      const { batches } = await api.listBatches();
      const active = batches.find((b) => b.status === "active");
      if (!active) {
        setView("home");
        return;
      }
      setBatch(active);
      const { vouchers: v } = await api.listVouchers(active._id);
      setVouchers(v);
      if (v.length === 0) {
        setView("home");
        return;
      }
      const allProcessed = v.every((x) => x.isProcessed);
      if (allProcessed) {
        await loadReport(active._id);
        setView("report");
      } else {
        setView("list");
      }
    } catch (err) {
      setLoadError(err.message);
      setView("home");
    }
  }

  // ---- Home / paste (first import) ----
  const handleParse = async (text) => {
    const result = parseVoucherText(text);
    setParsed(result);
    setAddMoreReturnView(null);
    setView("preview");
  };

  // ---- Add more vouchers (after an import already happened) ----
  const openAddMore = (fromView) => {
    setAddMoreReturnView(fromView);
    setView("add-more");
  };

  const handleParseAddMore = async (text) => {
    const result = parseVoucherText(text);
    setParsed(result);
    setView("preview");
  };

  const handleImport = async () => {
    setImporting(true);
    setError("");
    try {
      let currentBatch = batch;
      if (!currentBatch) {
        const { batch: created } = await api.createBatch({});
        currentBatch = created;
        setBatch(currentBatch);
      }
      await api.importVouchers(currentBatch._id, parsed.vouchers);
      const { vouchers: v } = await api.listVouchers(currentBatch._id);
      setVouchers(v);
      setParsed(null);

      if (addMoreReturnView) {
        if (addMoreReturnView === "report") {
          await loadReport(currentBatch._id);
        }
        setView(addMoreReturnView);
        setAddMoreReturnView(null);
      } else {
        setView("list");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleCancelImport = () => {
    setParsed(null);
    setView(addMoreReturnView || "home");
    setAddMoreReturnView(null);
  };

  // ---- Voucher list -> sequential processing ----
  const openVoucherForProcessing = (voucher) => {
    const idx = vouchers.findIndex((v) => v._id === voucher._id);
    setProcessingIndex(idx >= 0 ? idx : 0);
    setError("");
    setView("processing");
  };

  const refreshVouchers = async () => {
    const { vouchers: v } = await api.listVouchers(batch._id);
    setVouchers(v);
    return v;
  };

  const handleAddBank = async (name) => {
    const { bank } = await api.addBank(name);
    setBanks((prev) =>
      prev.some((b) => b.name === bank.name) ? prev : [...prev, bank],
    );
  };

  const handleDeleteBank = async (bank) => {
    await api.deleteBank(bank._id);
    setBanks((prev) => prev.filter((b) => b._id !== bank._id));
  };

  const handleSaveProcessing = async (data, opts) => {
    setSaving(true);
    setError("");
    const wasQueued = !!outstandingQueue;
    try {
      const current = vouchers[processingIndex];
      await api.updateVoucher(batch._id, current._id, data);
      const updated = await refreshVouchers();

      if (opts?.advance && wasQueued) {
        const continued = continueOutstandingQueue(current._id, updated);
        if (!continued) {
          await loadReport(batch._id);
          setView("outstanding");
        }
        return;
      }

      const isLast = processingIndex >= updated.length - 1;
      if (opts?.advance && !isLast) {
        setProcessingIndex((i) => i + 1);
      } else if (opts?.advance && isLast) {
        await loadReport(batch._id);
        setView("report");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePreviousProcessing = () => {
    setError("");
    setProcessingIndex((i) => Math.max(0, i - 1));
  };

  // ---- Report ----
  const refreshReport = async () => {
    await loadReport(batch._id);
  };

  // Lets the user jump to the report at any point, even with some
  // vouchers still unprocessed - it's just a live snapshot of whatever
  // is in MongoDB right now, same calculation as the "final" report.
  const goToReportEarly = async () => {
    await loadReport(batch._id);
    setView("report");
  };

  const goToAllVouchers = async () => {
    await refreshVouchers();
    setView("all-vouchers");
  };

  const goToOutstanding = () => {
    setOutstandingQueue(report?.vouchers?.outstandingVouchers || []);
    setView("outstanding");
  };

  // If we're mid-review of the outstanding list (see goToOutstanding),
  // opens the next voucher after the one just saved. Returns false when
  // there's no next one (or we weren't in that flow at all), so the
  // caller can fall back to its normal navigation.
  const continueOutstandingQueue = (currentVoucherId, updatedVouchers) => {
    if (!outstandingQueue) return false;
    const idx = outstandingQueue.findIndex((v) => v._id === currentVoucherId);
    const nextItem = idx >= 0 ? outstandingQueue[idx + 1] : undefined;
    if (!nextItem) {
      setOutstandingQueue(null);
      return false;
    }
    const full = updatedVouchers.find((v) => v._id === nextItem._id);
    if (!full) {
      setOutstandingQueue(null);
      return false;
    }
    setError("");
    if (!full.isProcessed) {
      openVoucherForProcessing(full);
    } else {
      setEditingVoucher(full);
      setView("edit-voucher");
    }
    return true;
  };

  // Opens a voucher for editing. If it hasn't been processed yet, route it
  // into the normal sequential processing flow instead (Save & Next,
  // advances to the next voucher) rather than the post-report "edit"
  // flow (Save Changes, always returns to the report) - otherwise every
  // voucher entered this way would immediately bounce back to the report.
  const openVoucherForEdit = (voucher) => {
    const full = vouchers.find((v) => v._id === voucher._id) || voucher;
    if (!full.isProcessed) {
      openVoucherForProcessing(full);
      return;
    }
    setEditingVoucher(full);
    setError("");
    setView("edit-voucher");
  };

  const openVoucherForEditFromReport = async (voucherSummary) => {
    const updated = await refreshVouchers();
    const full =
      updated.find((v) => v._id === voucherSummary._id) || voucherSummary;
    if (!full.isProcessed) {
      openVoucherForProcessing(full);
      return;
    }
    setEditingVoucher(full);
    setError("");
    setView("edit-voucher");
  };

  const handleSaveEdit = async (data) => {
    setSaving(true);
    setError("");
    const wasQueued = !!outstandingQueue;
    try {
      const savedId = editingVoucher._id;
      const updated = await api
        .updateVoucher(batch._id, savedId, data)
        .then(() => refreshVouchers());
      await refreshReport();
      const continued = wasQueued
        ? continueOutstandingQueue(savedId, updated)
        : false;
      if (!continued) {
        setEditingVoucher(null);
        setView(wasQueued ? "outstanding" : "report");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ---- Expenses ----
  const goToExpenses = async () => {
    const { expenses: e } = await api.listExpenses(batch._id);
    setExpenses(e);
    setView("expenses");
  };

  const handleAddExpense = async (data) => {
    setSaving(true);
    try {
      await api.addExpense(batch._id, data);
      const { expenses: e } = await api.listExpenses(batch._id);
      setExpenses(e);
      await refreshReport();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateExpense = async (id, data) => {
    setSaving(true);
    try {
      await api.updateExpense(batch._id, id, data);
      const { expenses: e } = await api.listExpenses(batch._id);
      setExpenses(e);
      await refreshReport();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    await api.deleteExpense(batch._id, id);
    const { expenses: e } = await api.listExpenses(batch._id);
    setExpenses(e);
    await refreshReport();
  };

  // ---- Total quantity sold today (batch-level, entered once) ----
  const handleSaveQuantity = async (value) => {
    if (!batch) return;
    setSavingQuantity(true);
    try {
      const { batch: updated } = await api.updateBatch(batch._id, {
        totalQuantity: value,
      });
      setBatch(updated);
      // The report's "Sales Quantity" row is a snapshot taken when the
      // report was last loaded, not read live from the batch - patch it
      // in place so it reflects the new value immediately instead of
      // waiting for the next full report reload.
      setReport((prev) =>
        prev
          ? {
              ...prev,
              vouchers: {
                ...prev.vouchers,
                totalQuantity: updated.totalQuantity,
              },
            }
          : prev,
      );
    } finally {
      setSavingQuantity(false);
    }
  };

  // ---- Reset day / delete all vouchers ----
  const handleResetDay = async () => {
    setResetting(true);
    try {
      if (batch) {
        await api.updateBatch(batch._id, { status: "closed" });
      }
      setBatch(null);
      setVouchers([]);
      setReport(null);
      setExpenses([]);
      setParsed(null);
      setOutstandingQueue(null);
      setResetOpen(false);
      setView("home");
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteAllVouchers = async () => {
    setResetting(true);
    try {
      if (batch) {
        await api.deleteAllVouchers(batch._id);
      }
      setVouchers([]);
      setReport(null);
      setOutstandingQueue(null);
      setDeleteAllOpen(false);
      setView("home");
    } finally {
      setResetting(false);
    }
  };

  // ---- Render ----
  if (view === "loading") {
    return <LoadingState label="Loading workspace..." />;
  }

  return (
    <>
      {loadError && (
        <div className="p-4">
          <ErrorState message={loadError} />
        </div>
      )}

      {view === "home" && (
        <PasteVoucher
          voucherCount={vouchers.length}
          onParse={handleParse}
          onResetAll={vouchers.length > 0 ? () => setDeleteAllOpen(true) : null}
          onViewVouchers={vouchers.length > 0 ? () => setView("list") : null}
        />
      )}

      {view === "add-more" && (
        <AddMoreVouchers
          onParse={handleParseAddMore}
          onBack={() => setView(addMoreReturnView || "list")}
        />
      )}

      {view === "preview" && parsed && (
        <ImportPreview
          parsed={parsed}
          importing={importing}
          onImport={handleImport}
          onCancel={handleCancelImport}
        />
      )}

      {view === "list" && (
        <VoucherList
          vouchers={vouchers}
          onOpenVoucher={openVoucherForProcessing}
          onBack={() => setView("home")}
          backLabel="Home"
          title="Vouchers"
          onAddMore={() => openAddMore("list")}
          onViewReport={goToReportEarly}
        />
      )}

      {view === "processing" && vouchers[processingIndex] && (
        <VoucherEditor
          voucher={vouchers[processingIndex]}
          index={processingIndex}
          total={vouchers.length}
          mode="process"
          banks={banks}
          onAddBank={handleAddBank}
          onDeleteBank={handleDeleteBank}
          onSave={handleSaveProcessing}
          onPrevious={handlePreviousProcessing}
          onBack={() => {
            setOutstandingQueue(null);
            setView("list");
          }}
          saving={saving}
          error={error}
        />
      )}

      {view === "report" && report && (
        <Report
          report={report}
          batch={batch}
          expenses={expenses}
          onViewOutstanding={goToOutstanding}
          onViewAllVouchers={goToAllVouchers}
          onViewExpenses={goToExpenses}
          onAddMore={() => openAddMore("report")}
          onResetDay={() => setResetOpen(true)}
          onSaveQuantity={handleSaveQuantity}
          savingQuantity={savingQuantity}
        />
      )}

      {view === "outstanding" && report && (
        <OutstandingPage
          vouchers={report.vouchers.outstandingVouchers}
          onBack={() => setView("report")}
          onOpenVoucher={openVoucherForEditFromReport}
        />
      )}

      {view === "all-vouchers" && (
        <VoucherList
          vouchers={vouchers}
          onOpenVoucher={openVoucherForEdit}
          onBack={() => setView("report")}
          backLabel="Report"
          title="All Vouchers"
          onAddMore={() => openAddMore("all-vouchers")}
        />
      )}

      {view === "edit-voucher" && editingVoucher && (
        <VoucherEditor
          voucher={
            vouchers.find((v) => v._id === editingVoucher._id) || editingVoucher
          }
          mode="edit"
          banks={banks}
          onAddBank={handleAddBank}
          onDeleteBank={handleDeleteBank}
          onSave={handleSaveEdit}
          onBack={() => {
            setOutstandingQueue(null);
            setEditingVoucher(null);
            setView("all-vouchers");
          }}
          saving={saving}
          error={error}
        />
      )}

      {view === "expenses" && (
        <ExpenseList
          expenses={expenses}
          onBack={() => setView("report")}
          onAddExpense={handleAddExpense}
          onUpdateExpense={handleUpdateExpense}
          onDeleteExpense={handleDeleteExpense}
          saving={saving}
        />
      )}

      <ConfirmModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={handleResetDay}
        confirming={resetting}
        title="Start a New Day?"
        confirmLabel="Start New Day"
        confirmingLabel="Starting..."
      >
        This will clear the current working session from the active workspace.
        Your existing records will remain stored.
      </ConfirmModal>

      <ConfirmModal
        open={deleteAllOpen}
        onClose={() => setDeleteAllOpen(false)}
        onConfirm={handleDeleteAllVouchers}
        confirming={resetting}
        title="Delete All Vouchers?"
        confirmLabel="Delete All"
        confirmingLabel="Deleting..."
        danger
      >
        This permanently removes every voucher in today&rsquo;s workspace. This
        cannot be undone.
      </ConfirmModal>
    </>
  );
}
