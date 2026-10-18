// Adapted from Ghost120494/ExistentialIncremental: same rules, plus saving and CSP-safe handlers.
var gameData = Object.assign({ gold: 0, goldPerClick: 1, goldPerClickCost: 100 }, JSON.parse(localStorage.getItem("eiSave") || "{}"));
function render() {
  document.getElementById("goldMined").textContent = gameData.gold + " Existential Crises";
  var up = document.getElementById("perClickUpgrade");
  up.textContent = "Read Nietzsche (+1 Crisis/second) Cost: " + gameData.goldPerClickCost + " Crises";
  up.disabled = gameData.gold < gameData.goldPerClickCost;
  document.getElementById("rate").textContent = gameData.goldPerClick + " crises per click and per second";
  localStorage.setItem("eiSave", JSON.stringify(gameData));
}
function mineGold() { gameData.gold += gameData.goldPerClick; render(); }
function buyGoldPerClick() {
  if (gameData.gold >= gameData.goldPerClickCost) {
    gameData.gold -= gameData.goldPerClickCost; gameData.goldPerClick += 1; gameData.goldPerClickCost *= 2; render();
  }
}
document.getElementById("mine").addEventListener("click", mineGold);
document.getElementById("perClickUpgrade").addEventListener("click", buyGoldPerClick);
setInterval(mineGold, 1000);
render();
