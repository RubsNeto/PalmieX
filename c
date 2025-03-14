// ... existing code ...

<script>
document.addEventListener("DOMContentLoaded", function() {
    if ("{{ user.username }}" === "rv-rubens" || "{{ user.username }}" === "rv-couros") {
        productionArea = 'balancinho';
    }
});
  document.addEventListener("DOMContentLoaded", function() {
// ... rest of the existing script code ...