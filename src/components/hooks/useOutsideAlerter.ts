import {useEffect} from "react";

export function useOutsideAlerter(ref:any, submit:()=>void) {
    useEffect(() => {
        /**
         * Alert if clicked on outside of element
         */
        function handleClickOutside(event:Event) {
            if (ref.current && !ref.current.contains(event.target)) {
                submit()
            }
        }
        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref]);
}
