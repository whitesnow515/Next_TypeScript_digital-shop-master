import React, { HTMLInputTypeAttribute, LegacyRef, Ref } from "react";

interface FieldProps {
  children?: React.ReactNode;
  id: string;
  name: string;
  type?: HTMLInputTypeAttribute | undefined;
  placeholder?: string | undefined;
  required?: boolean | undefined;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: boolean | undefined;
  textChildren?: React.ReactNode;
  refPassThrough?: Ref<any> | LegacyRef<any>;
  className?: string;
}

const Field = (props: FieldProps) => {
  return (
    <div className={props.className}>
      <label
        htmlFor={props.id}
        className="block mb-2 text-sm font-medium text-white"
      >
        {props.children}
      </label>
      <input
        ref={props.refPassThrough}
        type={props.type}
        name={props.name}
        id={props.id}
        className={`outline-none hover-circle border ${
          props.error ? "border-red-500 " : ""
        }sm:text-sm rounded-lg block w-full p-2.5 bg-[#141716] border-gray-600 placeholder-gray-400 text-white focus:border-primary-500 duration-300`}
        placeholder={props.placeholder}
        required={props.required}
        onChange={props.onChange}
      ></input>
      {props.textChildren}
    </div>
  );
};

export default Field;
