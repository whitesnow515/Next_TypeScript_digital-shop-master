import React from "react";

import { FormButtonProps } from "@components/FormButton";

interface ModalProps {
  id: string;
  children?: React.ReactNode;
  title: string;
  description: React.ReactNode;
  buttons?: React.ReactNode;
  wide?: boolean;
}

const Modal = (props: ModalProps) => {
  const modalClass = props.wide ? "wide" : "";

  return (
    <>
      <div className="hidden" id={props.id}>
        <div className="fixed z-10 inset-0 overflow-y-auto flex flex-col justify-center">
          <div className="mx-auto">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-800 opacity-50"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div
              className={`inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${modalClass}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-headline"
            >
              <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    {props.title && (
                      <h3
                        className="text-lg leading-6 font-medium text-gray-100"
                        id="modal-headline"
                      >
                        {props.title}
                      </h3>
                    )}
                    {props.description && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-300">
                          {props.description}
                        </p>
                      </div>
                    )}
                    {props.children}
                  </div>
                </div>
              </div>
              <div className="bg-[#141716] px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {props.buttons}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;

export interface ModalButtonProps extends FormButtonProps {}

export function ModalButton(props: ModalButtonProps) {
  function getColor() {
    if (!props.color || props.color === "") return "";
    return `bg-${props.color}-600`;
  }

  function getButton() {
    return (
      <button
        onClick={props.onClick}
        type={props.type || "button"}
        disabled={props.loading}
        className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${getColor()} text-base font-medium text-white hover:bg-${
          props.color
        }-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${
          props.color
        }-500 sm:ml-3 sm:w-auto sm:text-sm duration-300 ${props.style}`}
      >
        {props.loading && (
          <svg
            aria-hidden="true"
            role="status"
            className="inline w-4 h-4 mr-3 text-white animate-spin"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="#E5E7EB"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentColor"
            />
          </svg>
        )}
        {props.loading && props.loadingText}
        {!props.loading && props.children}
      </button>
    );
  }

  if (props.href) {
    return (
      <>
        <a href={props.href}>{getButton()}</a>
      </>
    );
  }
  return getButton();
}
