"use client";

import React, { Fragment, ReactNode, useEffect } from "react";
import "./modal-overlay.css";

type ModalProps = {
  children: ReactNode;
  className?: string;
};

type OverlayProps = {
  onClose: () => void;
  overlayClassName?: string;
};

type ModalOverlayProps = {
  children: ReactNode;
  onClose: () => void;
  className?: string;
  childrenClassName?: string;
  overlayClassName?: string;
};

const Modal: React.FC<ModalProps> = ({ children, className }) => {
  return <div className={`modal ${className}`}>{children}</div>;
};

const Overlay: React.FC<OverlayProps> = ({ onClose, overlayClassName }) => {
  return (
    <div className={`backdrop ${overlayClassName}`} onClick={onClose}></div>
  );
};

export const ModalOverlay: React.FC<ModalOverlayProps> = ({
  children,
  onClose,
  className,
  childrenClassName,
  overlayClassName,
}) => {
  useEffect(() => {
    document.body.style.overflowY = "hidden";

    return () => {
      document.body.style.overflowY = "auto";
    };
  }, []);

  return (
    <Fragment>
      <Modal className={className}>
        <div
          className={`${childrenClassName} my-auto flex h-full w-full flex-col items-start gap-4 2xl:gap-5 overflow-y-auto px-2 py-4 sm:px-4 sm:py-6`}
        >
          {children}
        </div>
      </Modal>
      <Overlay overlayClassName={overlayClassName} onClose={onClose} />
    </Fragment>
  );
};
