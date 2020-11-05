$(document).ready(() => {
  $("table").DataTable({
    ajax: {
      url: "/api/list",
      cache: true,
      dataSrc: "",
    },
    deferRender: true,
    pageLength: 10,
    stateSave: true,
  });

  document.onclick = (e) => {
    if (!e.target.matches("tbody tr td:first-child")) return;

    const pkgName = e.target.textContent;
    const url = "/" + pkgName;
    window.location.href = url;
  };
});
