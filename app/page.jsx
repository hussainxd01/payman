"use client";

import { useEffect, useState } from "react";
import api from "@/lib/apiClient";
import { parseVoucherText } from "@/lib/parsers/voucherParser";

import PasteVoucher from "@/components/home/PasteVoucher";
import AddMoreVouchers from "@/components/vouchers/AddMoreVouchers";
import ImportPreview from "@/components/vouchers/ImportPreview";
import VoucherList from "@/components/vouchers/VoucherList";
import VoucherEditor from "@/components/vouchers/VoucherEditor";
import EditVoucherDetailsModal from "@/components/vouchers/EditVoucherDetailsModal";
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
  const [saving, setSaving] = useState(false);
  const [savingQuantity, setSavingQuantity] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");

  // Editing a voucher's own details (number/party/amount) - separate
  // from the payment editor entirely, see EditVoucherDetailsModal.
  const [editingDetailsVoucher, setEditingDetailsVoucher] = useState(null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState("");

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
    try {
      const current = vouchers[processingIndex];
      await api.updateVoucher(batch._id, current._id, data);
      const updated = await refreshVouchers();

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
    setView("outstanding");
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

  const openVoucherForEditFromOutstanding = async (voucherSummary) => {
    const updated = await refreshVouchers();
    const full =
      updated.find((v) => v._id === voucherSummary._id) || voucherSummary;
    if (!full.isProcessed) {
      openVoucherForProcessing(full);
      return;
    }
    setEditingVoucher({ ...full, _editReturnView: "outstanding" });
    setError("");
    setView("edit-voucher");
  };

  const handleSaveEdit = async (data) => {
    setSaving(true);
    setError("");
    try {
      const savedId = editingVoucher._id;
      await api.updateVoucher(batch._id, savedId, data);
      await refreshVouchers();
      await refreshReport();

      const returnView = editingVoucher._editReturnView;
      setEditingVoucher(null);
      setView(returnView || "report");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ---- Edit a voucher's own details (number/party/amount) ----
  const openEditDetails = (voucher) => {
    setDetailsError("");
    setEditingDetailsVoucher(voucher);
  };

  const handleSaveDetails = async (data) => {
    if (!editingDetailsVoucher) return;
    setSavingDetails(true);
    setDetailsError("");
    try {
      const payload = {
        voucherNumber: data.voucherNumber,
        partyName: data.partyName,
      };
      if (
        Number(data.totalAmount) !== Number(editingDetailsVoucher.totalAmount)
      ) {
        payload.allowTotalAmountEdit = true;
        payload.totalAmount = data.totalAmount;
      }
      await api.updateVoucher(batch._id, editingDetailsVoucher._id, payload);
      await refreshVouchers();
      await refreshReport();
      setEditingDetailsVoucher(null);
    } catch (err) {
      setDetailsError(err.message);
    } finally {
      setSavingDetails(false);
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
      setDeleteAllOpen(false);
      setView("home");
    } finally {
      setResetting(false);
    }
  };

  // ---- Render ----
  if (view === "loading") {
    return (
      <div className="min-h-screen bg-[#f3f0e8] text-[#111111] font-sans">
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-black/15 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
                <img
                  src="/logo.png"
                  alt="Payment Tracker"
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <div className="text-[13px] font-black uppercase tracking-[-0.02em]">
                  Payment Tracker
                </div>
                <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-black/45">
                  Daily workspace
                </div>
              </div>
            </div>

            <span className="text-[10px] uppercase tracking-[0.2em] text-black/45">
              Workspace
            </span>
          </header>

          {/* Main */}
          <main className="flex-1 flex items-center justify-center px-6">
            <div className="w-full max-w-xl">
              {/* Status label */}
              <div className="flex items-center gap-3 mb-5">
                <span className="w-2 h-2 bg-[#111111] animate-pulse" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-black/55">
                  Initializing
                </span>
              </div>

              {/* Main loading block */}
              <div className="border border-black bg-white">
                <div className="px-6 py-5 border-b border-black/15 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Loading workspace
                  </span>

                  <span className="text-[11px] text-black/40">Please wait</span>
                </div>

                <div className="px-6 py-8">
                  <h1 className="text-4xl sm:text-5xl font-black tracking-[-0.04em] leading-none">
                    Getting things
                    <br />
                    <span className="inline-block bg-[#fff06a] px-2 py-1 mt-2">
                      ready.
                    </span>
                  </h1>

                  <p className="mt-6 text-sm text-black/50 max-w-sm leading-relaxed">
                    Preparing your vouchers, payments and workspace.
                  </p>

                  {/* Progress line */}
                  <div className="mt-10">
                    <div className="h-[2px] bg-black/10 overflow-hidden">
                      <div className="h-full w-1/3 bg-black animate-[loading_1.4s_ease-in-out_infinite]" />
                    </div>

                    <div className="mt-3 flex justify-between text-[10px] uppercase tracking-[0.15em] text-black/40">
                      <span>Loading</span>
                      <span>01 / 01</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tiny footer */}
              <div className="mt-4 flex justify-between text-[10px] uppercase tracking-[0.15em] text-black/30">
                <span>Payment Tracker</span>
                <span>Secure workspace</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
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
          onEditVoucher={openEditDetails}
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
          onOpenVoucher={openVoucherForEditFromOutstanding}
        />
      )}

      {view === "all-vouchers" && (
        <VoucherList
          vouchers={vouchers}
          onOpenVoucher={openVoucherForEdit}
          onEditVoucher={openEditDetails}
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
            const returnView = editingVoucher._editReturnView;
            setEditingVoucher(null);
            setView(returnView || "all-vouchers");
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

      <EditVoucherDetailsModal
        voucher={editingDetailsVoucher}
        onClose={() => setEditingDetailsVoucher(null)}
        onSave={handleSaveDetails}
        saving={savingDetails}
        error={detailsError}
      />
    </>
  );
}
