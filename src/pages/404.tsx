export default function Custom404() {
  return (
    <div className="w-full h-[100vh]">
      <div className="w-full h-[100vh] flex justify-center items-center flex-col">
        <h1 className="text-gray-100 text-3xl font-bold">
          Are you lost?&nbsp;
          <a href="/" className="underline text-white">
            Return home.
          </a>
        </h1>
      </div>
    </div>
  );
}
