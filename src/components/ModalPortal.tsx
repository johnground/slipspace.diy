import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
  onClose?: () => void;
}

export function ModalPortal({ children, onClose }: ModalPortalProps) {
  // Create a div that will be the modal container
  const modalRoot = document.getElementById('modal-root') || createModalRoot();
  const el = document.createElement('div');
  
  // Effect to append and remove the element from the DOM
  useEffect(() => {
    // Append the element to the modal root
    modalRoot.appendChild(el);
    
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
    
    // Clean up function to remove the element when component unmounts
    return () => {
      modalRoot.removeChild(el);
      
      // Restore body scrolling when modal is closed
      document.body.style.overflow = '';
    };
  }, [el, modalRoot]);
  
  // Create the portal
  return createPortal(
    <>
      <div 
        className="modal-overlay" 
        onClick={onClose}
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 15, 26, 0.8)',
          backdropFilter: 'blur(4px)',
          zIndex: 999999
        }}
      />
      <div 
        className="modal-container"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000000,
          padding: '1rem',
          overflow: 'auto'
        }}
      >
        <div 
          className="modal-content"
          style={{
            backgroundColor: 'rgba(15, 15, 26, 0.95)',
            border: '1px solid rgba(0, 102, 204, 0.2)',
            borderRadius: '1rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            width: '100%',
            maxWidth: '64rem',
            maxHeight: '90vh',
            overflow: 'auto',
            transform: 'translateZ(0)',
            willChange: 'transform'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>,
    el
  );
}

// Helper function to create the modal root if it doesn't exist
function createModalRoot() {
  const modalRoot = document.createElement('div');
  modalRoot.id = 'modal-root';
  document.body.appendChild(modalRoot);
  return modalRoot;
}
