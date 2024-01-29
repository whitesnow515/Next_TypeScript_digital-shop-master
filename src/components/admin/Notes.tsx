import { Book, ShieldCheck } from "phosphor-react";
import React from "react";

interface NotesProps {
  setOpen: (value: boolean) => void;
  handleSubmit: any;
  user: any;
  notes: any;
  setNotes: (value: string) => void;
}
export default function Notes({
  setOpen,
  handleSubmit,
  user,
  notes,
  setNotes,
}: NotesProps) {
  const [submitting, setSubmitting] = React.useState<boolean>();
  return (
    <div
      id="default-modal"
      tabIndex={-1}
      aria-hidden="true"
      className="overflow-y-auto overflow-x-hidden fixed  bg-black bg-opacity-40 top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-full"
    >
      <div className="relative p-4 w-full max-w-2xl m-auto mt-[5%] max-h-full">
        <div className="relative  text-center text-white p-3 py-5 rounded-lg shadow bg-[#1F2421]">
          <div
            className={
              "p-2.5 w-max rounded-md text-[#98C1FF] m-auto box-border"
            }
            style={{
              background:
                "linear-gradient(180deg, #435176  0%,#435176  36.41%, #1F2421 100%)",
            }}
          >
            <Book color={"#98C1FF"} weight={"duotone"} size={32} />
          </div>
          <div className={"font-semibold text-lg mt-4 mb-0.5"}>Notes</div>
          <textarea
            className={
              "w-[400px] border mt-4 text-sm bg-transparent border-[#737373] rounded-md p-2 resize-none min-h-[150px]"
            }
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className={"flex  gap-4 justify-center text-sm mt-6 mb-2"}>
            <div
              onClick={() => {
                setSubmitting(true);
                handleSubmit(user)
                  .then(() => {
                    setSubmitting(false);
                    setOpen(false);
                  })
                  .catch((err: Error) => {
                    setSubmitting(false);
                  });
              }}
              className={`bg-blue-600 text-white  hover:cursor-pointer text-white px-6 rounded-md py-1.5 ${
                submitting && "opacity-60 pointer-events-none"
              }`}
            >
              Submit
            </div>

            <div
              onClick={() => setOpen(false)}
              className={`border border-[#808080] text-[#DEDEDE]  hover:cursor-pointer text-white px-6 rounded-md py-1.5 ${
                submitting && "opacity-60 pointer-events-none"
              }`}
            >
              Close
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
