import className from "classnames";
import { IconType } from "react-icons/lib";

type ButtonPropsInterface = {
  xl?: boolean;
  children: React.ReactNode;
  icon?: IconType;
  style?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  color?: "primary" | "secondary" | "default" | "red" | "gray";
  className?: string;
};

const Button = (props: ButtonPropsInterface) => {
  const btnClass = className({
    btn: true,
    "btn-primary": true,
  });

  return (
    <div
      className={`${
        props.className || ""
      } inline-block rounded-md text-center hover-circle ${
        props.style ||
        `text-lg font-semibold py-2 px-4 cursor-pointer text-white bg-${
          props.color || "primary"
        }-500 hover:bg-${props.color || "primary"}-600 duration-300`
      }`}
      onClick={props.onClick}
    >
      {props.icon && <props.icon className="inline-block mr-2" />}
      {props.children}
      <style jsx>
        {`
          .btn {
            @apply inline-block rounded-md text-center;
          }

          .btn-primary {
            @apply text-white bg-primary-500;
          }

          .btn-primary:hover {
            @apply bg-primary-600;
          }
        `}
      </style>
    </div>
  );
};

export { Button };
