/* Veer Tools — one place for checkout links on the marketing pages.
   Paste each Lemon Squeezy (or Gumroad) checkout URL below once the products
   exist. Until then, every "Buy" link falls back to its data-fallback URL
   (normally the tool itself, where the Pro dialog explains pricing) and is
   labelled "Checkout opens soon".

   Usage in a page:
     <a class="btn btn-primary" data-checkout="nfc-pro" data-fallback="app.html">Get Pro</a>
     <script src="../assets/checkout.js" defer></script>

   The tool apps keep their own copy of these links in their PRO config
   (PRO.buyPro / PRO.buyCommercial near the top of each app.html script). */
(function(){
  var CHECKOUT = {
    "nfc-pro":        "",
    "nfc-commercial": "",
    "vectorizer-pro": "",
    "lightbox-pro":   "",
    "lightbox-commercial": "",
    "veer-pro":       ""     // bundle — not launched yet
  };
  document.querySelectorAll("a[data-checkout]").forEach(function(a){
    var url = CHECKOUT[a.getAttribute("data-checkout")];
    if(url){ a.href = url; a.target = "_blank"; a.rel = "noopener"; return; }
    var fb = a.getAttribute("data-fallback");
    if(fb){ a.href = fb; a.title = "Checkout opens soon. Try everything free in the tool meanwhile."; }
    else { a.setAttribute("aria-disabled","true"); a.removeAttribute("href"); }
  });
})();
