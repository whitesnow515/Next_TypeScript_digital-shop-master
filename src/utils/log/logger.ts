export default interface Logger {
  log: (classifier: string, ...message: any) => void;
  error: (classifier: string, ...message: any) => void;
  warn: (classifier: string, ...message: any) => void;
  info: (classifier: string, ...message: any) => void;
  debug: (classifier: string, ...message: any) => void;
}
