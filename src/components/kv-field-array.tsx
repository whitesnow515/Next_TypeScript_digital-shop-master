import React from "react";

import { Formik, Field, FieldArray } from "formik";
import { FaSave, FaTrash } from "react-icons/fa";

import FormButton from "@components/FormButton";

/*
const initialValues = {
  objects: [
    {key: "a", value: "b"},
    {key: "c", value: "d"},
  ],
};
 */

const normalObjectToKVArray = (obj: any) => {
  return {
    objects: Object.keys(obj).map((key) => ({ key, value: obj[key] })),
  };
};
const kvArrayToNormalObject = (kvArray: any) => {
  return kvArray.objects.reduce((acc: any, cur: any) => {
    acc[cur.key] = cur.value;
    return acc;
  }, {});
};

type KeyValueFieldArrayProps = {
  initialValues: any;
  onChange: (newValues: any) => void;
};

const KeyValueFieldArray = (props: KeyValueFieldArrayProps) => {
  return (
    <div>
      <Formik
        initialValues={normalObjectToKVArray(props.initialValues)}
        onSubmit={() => {}}
      >
        {({ values }) => (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              props.onChange(kvArrayToNormalObject(values));
            }}
          >
            <FieldArray name="objects">
              {({ insert, remove, push }) => (
                <div className={"flex flex-col gap-4"}>
                  {values.objects.length > 0 &&
                    values.objects.map((object, index) => (
                      <div key={index} className={"flex flex-row gap-2"}>
                        <Field
                          name={`objects.${index}.key`}
                          placeholder={"Key"}
                          className="outline-none hover-circle shadow shadow-black border hover:border-white focus:border-white sm:text-sm rounded-lg block w-full p-2.5 bg-[#303633] border-[#414352] placeholder-gray-400 text-white duration-300"
                        />
                        <Field
                          name={`objects.${index}.value`}
                          placeholder={"Value"}
                          className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                        />
                        <FormButton
                          type="button"
                          onClick={() => remove(index)}
                          icon={<FaTrash />}
                          color={"red"}
                          className={"w-10"}
                        />
                      </div>
                    ))}
                  <div className={"flex flex-row items-center gap-2"}>
                    <div>
                      <FormButton
                        type="button"
                        onClick={() => push({ key: "", value: "" })}
                      >
                        Add Entry
                      </FormButton>
                    </div>
                    <div>
                      <FormButton
                        type="submit"
                        id={"kv-field-array-submit"}
                        icon={<FaSave />}
                      />
                    </div>
                  </div>
                </div>
              )}
            </FieldArray>
            {/*
            <div className={"px-4 w-full"}>
              <FormButton className={"mt-8"} type="submit">Submit</FormButton>
            </div>
            */}
          </form>
        )}
      </Formik>
    </div>
  );
};

export default KeyValueFieldArray;
