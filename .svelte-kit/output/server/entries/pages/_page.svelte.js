import "clsx";
var Step = /* @__PURE__ */ ((Step2) => {
  Step2[Step2["SUBJECT"] = 0] = "SUBJECT";
  Step2[Step2["SYSTEM"] = 1] = "SYSTEM";
  Step2[Step2["TYPE"] = 2] = "TYPE";
  Step2[Step2["SEMESTER"] = 3] = "SEMESTER";
  Step2[Step2["FILES"] = 4] = "FILES";
  return Step2;
})(Step || {});
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    Step.SUBJECT;
    [
      { s: Step.SUBJECT, l: "Subject" },
      { s: Step.SYSTEM, l: "System" },
      { s: Step.TYPE, l: "Type" },
      { s: Step.SEMESTER, l: "Semester" },
      { s: Step.FILES, l: "Papers" }
    ];
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-950 via-teal-900 to-emerald-950"><div class="text-center"><div class="animate-spin h-14 w-14 border-4 border-teal-400 border-t-transparent rounded-full mx-auto mb-4"></div> <p class="text-teal-200 text-lg font-medium">Loading BuPYQs...</p></div></div>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
