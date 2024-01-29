import className from "classnames";
import { IconType } from "react-icons/lib";

type ButtonPropsInterface = {
  xl?: boolean;
  children: React.ReactNode;
  icon?: IconType;
  style?: string;
  href: string;
};

const ButtonLink = (props: ButtonPropsInterface) => {
  const btnClass = className({
    btn: true,
    "btn-primary": true,
  });

  return (
    <a href={props.href}>
      <div
        className={`${btnClass} hover-circle ${
          props.style || "text-lg font-semibold py-2 px-4"
        } cursor-pointer duration-300`}
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
    </a>
  );
};

export { ButtonLink };
