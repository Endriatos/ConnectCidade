function Health() {
  const buildTime = import.meta.env.VITE_BUILD_TIME || 'indisponivel';
  const gitSha = import.meta.env.VITE_GIT_SHA || 'indisponivel';

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <section className="w-full max-w-xl rounded-xl border border-gray-200 p-5">
        <h1 className="mb-3 text-2xl font-bold">Saúde do sistema!!!!!</h1>
        <p className="mb-2">Publicado em: {buildTime}</p>
        <p>Versão (commit): {gitSha}</p>
      </section>
    </main>
  );
}

export default Health;
