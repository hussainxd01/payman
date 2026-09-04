"use client";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  confirming,
  title,
  children,
  confirmLabel = "Confirm",
  confirmingLabel = "Working...",
  danger = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={confirming}
          >
            {confirming ? confirmingLabel : confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
