$(document).ready(() => {
  $("table").DataTable({
    ajax: {
      url: "/api/list",
      cache: true,
      dataSrc: "data",
    },
    deferRender: true,
    pageLength: 10,
    stateSave: true,
  });

  document.onclick = (e) => {
    if (!e.target.matches("tbody tr td:first-child")) return;

    const pkgName = e.target.textContent;
    const url = "/" + pkgName;

    // reuse current tab:
    // window.location.replace(url);

    // open new tab:
    window.open(url);
  };
});
