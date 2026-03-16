import React from 'react';

const ElectronOnlyApp = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-12">
    <section className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">CheckPR Desktop</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Esta aplicacion requiere Electron</h1>
      <p className="mt-4 text-sm leading-7 text-slate-600">
        El renderer se abrio sin el bridge nativo, asi que las integraciones, snapshots y analisis no estan disponibles.
        Ejecuta la app desde Electron con <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-900">npm run start</code> o abre el binario empaquetado.
      </p>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
        <p className="font-medium text-slate-900">Diagnostico rapido</p>
        <p className="mt-2">Si ves esta pantalla dentro de la ventana de la app, el preload no se cargo correctamente y hay que revisar el arranque de Electron.</p>
      </div>
    </section>
  </div>
);

export default ElectronOnlyApp;
