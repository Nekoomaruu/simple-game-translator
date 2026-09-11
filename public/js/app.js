const Router = (() => {
  const navItems = document.querySelectorAll('.nav-item');
  const panels = document.querySelectorAll('[data-view-panel]');
  const pageModules = { translate: TranslatePage, revision: RevisionPage };

  function setActiveView(viewName) {
    navItems.forEach((btn) => btn.classList.toggle('nav-item-active', btn.dataset.view === viewName));
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.viewPanel !== viewName;
    });

    const module = pageModules[viewName];
    if (module && module.onActivate) module.onActivate();
  }

  function bindEvents() {
    navItems.forEach((btn) => {
      btn.addEventListener('click', () => setActiveView(btn.dataset.view));
    });
  }

  function init() {
    bindEvents();
    setActiveView('dashboard');
  }

  return { init };
})();

(async () => {
  await Dashboard.init();
  await TranslatePage.init();
  await RevisionPage.init();
  Router.init();
})();
