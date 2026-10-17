import { usePWAInstall } from '../hooks/usePWAInstall';

export function InstallSection() {
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();

  // Si ya está instalada, no mostrar nada
  if (isInstalled) {
    return null;
  }

  // Instrucciones para iOS
  if (isIOS) {
    return (
      <section className="install-section">
        <h3 className="install-title">Instalar app</h3>
        <p className="install-description">
          Para instalar en iOS:
        </p>
        <ol className="install-steps">
          <li>Toca el botón Compartir <span className="install-icon">↑</span></li>
          <li>Selecciona &quot;Añadir a pantalla de inicio&quot;</li>
          <li>Toca &quot;Añadir&quot;</li>
        </ol>
      </section>
    );
  }

  // Botón de instalación para Android/Desktop
  if (canInstall) {
    return (
      <section className="install-section">
        <h3 className="install-title">Instalar app</h3>
        <p className="install-description">
          Instala Pomodoro para acceso rápido y uso sin conexión.
        </p>
        <button
          type="button"
          className="install-button"
          onClick={install}
        >
          Instalar
        </button>
      </section>
    );
  }

  // Sin opción de instalación disponible
  return null;
}
