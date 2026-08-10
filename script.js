// ============ Anonymous Auth ============
let currentUser = null;
firebase.auth().signInAnonymously().catch((error) => {
  console.error("Auth error:", error);
});
firebase.auth().onAuthStateChanged((user) => {
  currentUser = user;
});

// ============ Logo Animation ============
const logos = ["NEXORA", "NEXORA EXCHANGE", "NX EXCHANGE", "NEXORA"];
let logoIndex = 0;
const logoElement = document.getElementById("logo");
if (logoElement) {
  setInterval(() => {
    logoElement.style.opacity = "0";
    setTimeout(() => {
      logoIndex = (logoIndex + 1) % logos.length;
      logoElement.textContent = logos[logoIndex];
      logoElement.style.opacity = "1";
    }, 300);
  }, 3000);
}

// ============ Side Menu ============
const menuBtn = document.getElementById("menuBtn");
const closeBtn = document.getElementById("closeBtn");
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("overlay");

menuBtn.addEventListener("click", () => {
  sideMenu.classList.add("active");
  overlay.classList.add("active");
});
closeBtn.addEventListener("click", () => {
  sideMenu.classList.remove("active");
  overlay.classList.remove("active");
});
overlay.addEventListener("click", () => {
  sideMenu.classList.remove("active");
  overlay.classList.remove("active");
});

// ============ Exchange Form + Countdown + Live Chat ============
const submitBtn = document.getElementById("submitBtn");
const resultBox = document.getElementById("resultBox");
const totalAmountEl = document.getElementById("totalAmount");
const countdownEl = document.getElementById("countdown");
const statusNote = document.getElementById("statusNote");
const chatMessagesEl = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");

let currentChatId = localStorage.getItem("nexoraChatId") || null;
let timerInterval = null;

submitBtn.addEventListener("click", function () {
  const amount = document.getElementById("amount").value;
  const currencySelect = document.getElementById("currency");
  const methodSelect = document.getElementById("method");

  const currencyText = currencySelect.options[currencySelect.selectedIndex].text;
  const methodText = methodSelect.options[methodSelect.selectedIndex].text;
  const currencyRate = parseFloat(currencySelect.value);
  const methodRate = parseFloat(methodSelect.value);

  if (!amount || amount <= 0) {
    alert("Please enter a valid amount");
    return;
  }
  if (!methodRate) {
    alert("Please select a payment method");
    return;
  }

  const usdAmount = amount * currencyRate;
  const total = usdAmount * methodRate;
  const totalFormatted = "₦" + total.toLocaleString();

  totalAmountEl.textContent = totalFormatted;
  resultBox.style.display = "block";
  resultBox.scrollIntoView({ behavior: "smooth" });

  startCountdown();

  if (!currentUser) {
    alert("Still connecting, please try again in a moment.");
    return;
  }

  const chatRef = db.ref("chats").push();
  currentChatId = chatRef.key;
  localStorage.setItem("nexoraChatId", currentChatId);

  chatRef.set({
    userId: currentUser.uid,
    currency: currencyText,
    amount: amount,
    method: methodText,
    total: totalFormatted,
    status: "pending",
    createdAt: Date.now()
}).catch((error) => {
    console.error("Write error:", error);
});

  chatRef.child("messages").push({
    sender: "customer",
    text: `New request — Currency: ${currencyText}, Amount: ${amount}, Method: ${methodText}, Total: ${totalFormatted}`,
    time: Date.now()
  });
  emailjs.init({ publicKey: "Gftdv_krKo2gLA9J5" });
emailjs.send("service_k687x1g", "template_606f1lw", {
  currency: currencyText,
  amount: amount,
  method: methodText,
  total: totalFormatted
});

  listenForMessages(currentChatId);
// Instant phone notification via ntfy
  fetch("https://ntfy.sh/nexora-exchange-alert-3920", {
    method: "POST",
    body: `New request — ${methodText}, Amount: ${amount}, Total: ${totalFormatted}`,
    headers: { "Title": "🔔 New Nexora Request", "Priority": "high" }
  });
});

function startCountdown() {
  if (timerInterval) clearInterval(timerInterval);
  let timeLeft = 5 * 60;
  updateCountdownDisplay(timeLeft);

  timerInterval = setInterval(() => {
    timeLeft--;
    updateCountdownDisplay(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      countdownEl.textContent = "0:00";
      countdownEl.style.color = "#C8FF00";
      statusNote.textContent = "Still with us? Send a message below anytime.";
    }
  }, 1000);
}

function updateCountdownDisplay(timeLeft) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  countdownEl.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function listenForMessages(chatId) {
  chatMessagesEl.innerHTML = "";
  db.ref("chats/" + chatId + "/messages").on("child_added", (snapshot) => {
    const msg = snapshot.val();
    addMessageToUI(msg.sender, msg.text);
  });
}

function addMessageToUI(sender, text) {
  const bubble = document.createElement("div");
  bubble.className = sender === "admin" ? "chat-bubble admin" : "chat-bubble customer";
  bubble.textContent = text;
  chatMessagesEl.appendChild(bubble);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

if (chatSendBtn) {
  chatSendBtn.addEventListener("click", sendCustomerMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendCustomerMessage();
  });
}

function sendCustomerMessage() {
  const text = chatInput.value.trim();
  if (!text || !currentChatId) return;
  db.ref("chats/" + currentChatId + "/messages").push({
    sender: "customer",
    text: text,
    time: Date.now()
  });
  chatInput.value = "";
}

// Resume an existing chat if customer reloads the page
if (currentChatId) {
  resultBox.style.display = "block";
  listenForMessages(currentChatId);
}
