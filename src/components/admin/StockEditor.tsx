import React, { useEffect, useRef, useState } from "react";

import { Editor, Monaco } from "@monaco-editor/react";
import { FormControlLabel, Grid, Switch } from "@mui/material";
import axios from "axios";
import { useSnackbar } from "notistack";
import { FaFileImport } from "react-icons/fa";
import Swal from "sweetalert2";

import Modal, { ModalButton } from "@components/admin/Modal";
import FormButton from "@components/FormButton";
import { copyToClipboard } from "@pages/pay/cashapp/[id]";
import { debug, error as errorLog } from "@util/log";

const Modals = (props: {
  data: string;
  setData: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const snackbar = useSnackbar();
  const [behavior, setBehavior] = useState<"append" | "replace">("append");
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <Modal
        id={"add-modal"}
        title={"Import Stock"}
        description={"Import stock from another location"}
        buttons={
          <>
            <ModalButton
              color={"primary"}
              onClick={() => {
                document.getElementById("add-modal")?.classList.add("hidden");
                document
                  .getElementById("import-url-modal")
                  ?.classList.remove("hidden");
              }}
            >
              URL
            </ModalButton>
            <ModalButton
              color={"primary"}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".txt";
                input.onchange = (_) => {
                  // get file data
                  const file = input.files?.[0];
                  if (!file) {
                    return;
                  }
                  const reader = new FileReader();
                  reader.readAsText(file);
                  reader.onload = async (e) => {
                    const text = e.target?.result;
                    if (!text) {
                      return;
                    }
                    debug(text);
                    if (behavior === "append") {
                      props.setData(`${props.data}\n${text}`);
                    } else {
                      props.setData(text as string);
                    }
                    document
                      .getElementById("add-modal")
                      ?.classList.add("hidden");
                    // remove the input
                    input.remove();
                    snackbar.enqueueSnackbar("Stock imported!", {
                      variant: "success",
                    });
                  };
                };
                input.click();
              }}
            >
              File
            </ModalButton>
            <ModalButton
              color={"red"}
              onClick={() => {
                document.getElementById("add-modal")?.classList.add("hidden");
              }}
            >
              Cancel
            </ModalButton>
          </>
        }
      >
        <select
          id={"behavior-select"}
          className="hover-circle cursor-pointer outline-none px-[10px] py-2 bg-gray-800 text-gray-100 border-2 border-gray-700 rounded-lg mt-4 w-full"
          value={behavior}
          onChange={(e) => {
            setBehavior(e.target.value as any);
          }}
        >
          <option value={"append"}>Append</option>
          <option value={"replace"}>Replace</option>
        </select>
      </Modal>
      <Modal
        id={"import-url-modal"}
        title={"Import Stock"}
        description={"Import stock from another location. "}
        buttons={
          <div>
            <ModalButton
              color={"primary"}
              onClick={() => {
                const url = inputRef.current?.value;
                if (!url) {
                  return;
                }
                axios
                  .get(url)
                  .then((res) => {
                    if (behavior === "append") {
                      props.setData(`${props.data}\n${res.data}`);
                    } else {
                      props.setData(res.data);
                    }
                    snackbar.enqueueSnackbar("Stock imported!", {
                      variant: "success",
                    });
                    document
                      .getElementById("import-url-modal")
                      ?.classList.add("hidden");
                  })
                  .catch((eX) => {
                    Swal.fire({
                      icon: "error",
                      title: "Error!",
                      text: "Failed to import stock! (Info in console)",
                    });
                    errorLog(eX);
                  });
              }}
            >
              Import
            </ModalButton>
            <ModalButton
              color={"red"}
              onClick={() => {
                document
                  .getElementById("import-url-modal")
                  ?.classList.add("hidden");
              }}
            >
              Cancel
            </ModalButton>
          </div>
        }
      >
        <input
          id={"import-url-input"}
          ref={inputRef}
          className="hover-circle cursor-pointer outline-none px-[10px] py-2 bg-gray-800 text-gray-100 border-2 border-gray-700 rounded-lg mt-4 w-full"
          type={"url"}
          placeholder={"https://example.com/stock.txt"}
        />
      </Modal>
    </>
  );
};

interface StockEditorProps {
  data: string;
  setData: React.Dispatch<React.SetStateAction<string>>;
  renderInfo?: (data: string) => JSX.Element;
  save: (data: string[]) => Promise<void>;
  height?: string;
}

const StockEditor = ({
  data,
  setData,
  renderInfo = (d) => (
    <span>{d.split("\n").length.toLocaleString()} line(s)</span>
  ),
  save,
  height = "65vh",
}: StockEditorProps) => {
  const snackbar = useSnackbar();
  const [checkDuplicate, setCheckDuplicate] = useState<boolean>(true);

  const [decorations, setDecorations] = useState<any[]>([]);

  const monacoObjects = useRef<{
    monaco: Monaco | null;
    editor: any | null; // editor.IStandaloneEditor
  } | null>(null);

  // O(N^2) algorithm to get duplicate lines, we can definitely do better
  /*
  function getDuplicateLines(original = true): number[] {
    const lines = data.split("\n");
    const duplicateLines: number[] = [];
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (!line || line.trim().length === 0) continue;
      if (lines.indexOf(line) !== i) {
        duplicateLines.push(i + 1);
        if (original) duplicateLines.push(lines.indexOf(line) + 1); // make the original line highlighted too
      }
    }
    return duplicateLines;
  }
   */

  // O(N)
  function getDuplicateLines(original = true): number[] {
    const linesMap = new Map<string, number>();
    const lines = data.split("\n");
    const duplicateLines: number[] = [];

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (!line || line.trim().length === 0) continue;

      if (linesMap.get(line)) {
        duplicateLines.push(i + 1);
        if (original) {
          const cached = linesMap.get(line);
          if (cached) duplicateLines.push(cached);
        }
      } else {
        linesMap.set(line, i + 1);
      }
    }
    return duplicateLines;
  }

  function createHighlight(line: number) {
    const monaco = monacoObjects.current?.monaco;
    if (!monaco) return null;
    const r = new monaco.Range(line, 1, line, 1);
    return {
      range: r,
      options: {
        inlineClassName: "highlight-red",
        isWholeLine: true,
        minimap: {
          color: "#ff0000",
          darkColor: "#ff0000",
          position: 1,
        },
        hoverMessage: {
          value: "This line is duplicated.",
        },
      },
    };
  }

  function highlightDuplicates() {
    if (!monacoObjects.current || !checkDuplicate) return;
    const { monaco, editor } = monacoObjects.current;

    // find duplicates and highlight them
    const markers: any[] = [];

    // find duplicate lines, and highlight both of them
    const duplicateLines: number[] = getDuplicateLines();
    duplicateLines.forEach((line) => {
      const hl = createHighlight(line);
      if (!hl) return;
      markers.push(hl);
    });

    setDecorations(editor.deltaDecorations(decorations, markers));
    // editor.createDecorationsCollection(markers);
  }

  function cleanupDuplicates(showAlertOnNoneFound = true): Promise<{
    data?: string;
    reprompt?: boolean;
    cancel?: boolean;
  }> {
    return new Promise((resolve) => {
      const duplicateLines: number[] = getDuplicateLines(false);
      if (duplicateLines.length === 0) {
        if (showAlertOnNoneFound) {
          Swal.fire({
            title: "No Duplicates",
            html: `No duplicate lines were found.`,
            icon: "success",
          });
        }
        resolve({ data, reprompt: false, cancel: false });
        return;
      }
      // alert the user with Swal about how many duplicate lines were found
      // ask them if they want to remove them, also give a option to copy the duplicate lines to clipboard
      Swal.fire({
        title: "Remove Duplicates",
        html: `Found <b>${duplicateLines.length.toLocaleString()}</b> duplicate lines. Do you want to remove them?`,
        icon: "warning",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        denyButtonText: "Copy to clipboard",
        denyButtonColor: "#3085d6",
      }).then(async (result) => {
        if (result.isConfirmed) {
          // remove duplicates
          const newLines = data
            .split("\n")
            .filter((line, index, self) => self.indexOf(line) === index);
          const s = newLines.join("\n");
          await setData(s);
          Swal.fire({
            title: "Removed Duplicates",
            html: `Removed <b>${duplicateLines.length.toLocaleString()}</b> duplicate lines.`,
            icon: "success",
          });
          resolve({ data: s, reprompt: false, cancel: false });
        } else if (result.isDenied) {
          // get the duplicate lines and copy them to clipboard
          const duplicateLinesString = duplicateLines
            .map((line) => data.split("\n")[line - 1])
            .join("\n");
          debug(duplicateLinesString);
          if (!copyToClipboard(duplicateLinesString)) {
            snackbar.enqueueSnackbar(
              "Clipboard not supported on your browser!",
              {
                variant: "error",
              }
            );
          }
          snackbar.enqueueSnackbar("Copied to clipboard", {
            variant: "success",
          });
          resolve({ reprompt: true });
        } else {
          resolve({ data, cancel: true });
        }
      });
    });
  }

  useEffect(() => {
    highlightDuplicates();
  }, [data]);

  return (
    <div>
      <Modals data={data} setData={setData} />
      <>
        <div>
          <FormControlLabel
            control={
              <Switch
                defaultChecked={checkDuplicate}
                onChange={() => {
                  const res = !checkDuplicate;
                  setCheckDuplicate(res);
                  if (!monacoObjects.current) return;
                  if (res) {
                    highlightDuplicates();
                  } else {
                    const { editor } = monacoObjects.current;
                    setDecorations(editor.deltaDecorations(decorations, []));
                  }
                }}
              />
            }
            label="Check Duplicates (disable if very laggy)"
          />
          <span className={"text-sm"}>· {renderInfo(data)}</span>
        </div>
        <div id={"editor-div"}>
          <Editor
            height={height}
            value={data}
            defaultLanguage={"plaintext"}
            onChange={(value) => {
              setData(value ?? "");
            }}
            theme={"vs-dark"}
            onMount={(editor, monaco) => {
              monacoObjects.current = { monaco, editor };
              highlightDuplicates();
              // get editor-div > section and add margin: 0
              // I honestly have no other solution for this
              const editorDiv = document.getElementById("editor-div");
              if (editorDiv) {
                const editorDivSection =
                  editorDiv.getElementsByTagName("section")[0];
                if (editorDivSection) {
                  editorDivSection.style.margin = "0";
                }
              }
            }}
          />
        </div>
        <Grid container spacing={2} className={"mt-2"}>
          <Grid item xs={12} md={8}>
            <FormButton
              type={"button"}
              onClickLoading={() => {
                return new Promise<void>(async (resolve) => {
                  let d = null;
                  while (!d || d.reprompt) {
                    // eslint-disable-next-line no-await-in-loop
                    d = await cleanupDuplicates(false);
                    // if (d.cancel) {
                    //  resolve();
                    //  return;
                    // }
                  }
                  const arr = (d.data ?? data)?.split("\n");
                  await save(arr).then(resolve);
                });
              }}
              color={"green"}
            >
              Save
            </FormButton>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormButton
              type={"button"}
              onClickLoading={() => {
                return cleanupDuplicates();
              }}
            >
              Remove Duplicates
            </FormButton>
          </Grid>
          <Grid item xs={12} md={1}>
            <FormButton
              type={"button"}
              onClick={() => {
                document
                  .getElementById("add-modal")
                  ?.classList.remove("hidden");
              }}
              icon={<FaFileImport />}
            />
          </Grid>
        </Grid>
      </>
    </div>
  );
};
export default StockEditor;
