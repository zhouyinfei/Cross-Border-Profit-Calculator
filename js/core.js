	let isPro = false;
	const PLATFORM_FEES = {
	  "Amazon FBA US": 15,
	  "Amazon FBM": 12,
	  "Shopify (Stripe)": 2.9,
	  "Etsy": 6.5
	};
	function onPlatformChange() {
	  if (!isPro) return;

	  const platform = document.getElementById("platformSelect").value;
	  const fee = PLATFORM_FEES[platform];

	  if (fee !== undefined) {
		document.getElementById("platformFeePercent").value = fee;
		calculate();
	  }
	}
    function openUpgrade() {
      document.getElementById("upgradeModal").style.display = "flex";
    }
    


	function unlockProFeatures() {
	  document.querySelectorAll(".pro-lock").forEach(card => {
		card.classList.remove("pro-lock");

		const overlay = card.querySelector(".pro-overlay");
		if (overlay) overlay.remove();

		const content = card.querySelector(".pro-content");
		if (content) {
		  content.style.opacity = "1";
		  content.style.pointerEvents = "auto";
		}
	  });

	  // 可选：隐藏顶部 Upgrade 按钮
	  const upgradeBtn = document.querySelector("header button");
	  if (upgradeBtn) {
		upgradeBtn.innerText = "Pro Active";
		upgradeBtn.disabled = true;
	  }
	  const platformSelect = document.getElementById("platformSelect");
		if (platformSelect) {
		  platformSelect.disabled = false;
		}
	  calculateScenarios();
	}


  function calculate() {
    const productCost = parseFloat(document.getElementById("productCost").value) || 0;
    const shippingCost = parseFloat(document.getElementById("shippingCost").value) || 0;
    const otherCost = parseFloat(document.getElementById("otherCost").value) || 0;
    const platformFeePercent = parseFloat(document.getElementById("platformFeePercent").value) || 0;
    const marginPercent = parseFloat(document.getElementById("margin").value) || 0;

    const baseCost = productCost + shippingCost + otherCost;
    const platformFeeRate = platformFeePercent / 100;
    const marginRate = marginPercent / 100;

	// 最大可行利润率（给 5% 安全空间）
	const maxMarginRate = 1 - platformFeeRate - 0.05;

	if (marginRate >= maxMarginRate) {
	  document.getElementById("price").innerText = "N/A";

	  document.querySelector(".metrics").innerHTML = `
		<div style="color: var(--danger); font-weight: 600;">
		  Your target margin will cause losses on this platform
		</div>
		<div style="color: var(--muted);">
		  Max recommended margin: ${(maxMarginRate * 100).toFixed(0)}%
		</div>
		<div style="color: var(--muted);">
		  Lower your margin or choose a safer platform
		</div>
	  `;
	  return;
	}


    // 推荐售价（关键公式）
    const price = baseCost / (1 - platformFeeRate - marginRate);

    const platformFee = price * platformFeeRate;
    const profit = price - baseCost - platformFee;
    const breakEvenPrice = baseCost / (1 - platformFeeRate);

    // 更新 UI
    document.getElementById("price").innerText = `$${price.toFixed(2)}`;

    document.querySelector(".metrics").innerHTML = `
      <div>Profit / Unit: <strong>$${profit.toFixed(2)}</strong></div>
      <div>Margin: <strong>${((profit / price) * 100).toFixed(1)}%</strong></div>
      <div>Break-even: <strong>$${breakEvenPrice.toFixed(2)}</strong></div>
    `;
	generateAIInsights();
	calculateScenarios();
  }

  // 监听所有输入变化
  document.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", calculate);
  });
  
	function calculateScenarios() {
	  if (!isPro) return;

	  const productCost = parseFloat(document.getElementById("productCost").value) || 0;
	  const shippingCost = parseFloat(document.getElementById("shippingCost").value) || 0;
	  const otherCost = parseFloat(document.getElementById("otherCost").value) || 0;
	  const marginRate = (parseFloat(document.getElementById("margin").value) || 0) / 100;

	  const baseCost = productCost + shippingCost + otherCost;
	  const tbody = document.getElementById("scenarioTableBody");
	  tbody.innerHTML = "";

	  // 先算所有平台的数据
	  const scenarios = [];

	  Object.entries(PLATFORM_FEES).forEach(([platform, feePercent]) => {
		const feeRate = feePercent / 100;

		if (marginRate >= 1 - feeRate) return;

		const price = baseCost / (1 - feeRate - marginRate);
		const platformFee = price * feeRate;
		const profit = price - baseCost - platformFee;
		const margin = (profit / price) * 100;
		const breakEvenPrice = baseCost / (1 - feeRate);

		scenarios.push({
		  platform,
		  price,
		  profit,
		  margin,
		  breakEvenPrice
		});
	  });

	  if (scenarios.length === 0) return;

	  // 找到最低 Break-even
	  const minBreakEven = Math.min(...scenarios.map(s => s.breakEvenPrice));
	  
	  // 找到最高 Profit
      const maxProfit = Math.max(...scenarios.map(s => s.profit));

	  // 渲染表格
	  scenarios.forEach(s => {
		const isLowest = s.breakEvenPrice === minBreakEven;
		const isBest = s.profit === maxProfit;

		const row = document.createElement("tr");
		if (isLowest) row.classList.add("lowest-break-even");

		row.innerHTML = `
		  <td>
			${s.platform}
			${isLowest ? `
              <div class="risk-card">
                <div class="risk-tag">RECOMMENDED</div>
                <div class="risk-title">Lowest Risk</div>
                <div class="risk-sub">Lowest break-even price</div>
              </div>
            ` : ""}
            ${isBest ? `
              <div class="profit-card">
                <div class="profit-tag">MOST PROFITABLE</div>
                <div class="profit-title">Highest Profit</div>
                <div class="profit-sub">Max net earnings</div>
              </div>
            ` : ""}

		  </td>
		  <td>$${s.price.toFixed(2)}</td>
		  <td>$${s.profit.toFixed(2)}</td>
		  <td>${s.margin.toFixed(1)}%</td>
		  <td>$${s.breakEvenPrice.toFixed(2)}</td>
		`;

		tbody.appendChild(row);
	  });
	}

	function exportCSV() {
	  if (!isPro) {
		alert("Upgrade to Pro to export CSV");
		return;
	  }
	  
	  const btn = document.getElementById("exportCsvBtn");
		btn.innerText = "Downloaded ✓";

		setTimeout(() => {
		  btn.innerText = "Export CSV";
		}, 2000);

	  const productCost = parseFloat(document.getElementById("productCost").value) || 0;
	  const shippingCost = parseFloat(document.getElementById("shippingCost").value) || 0;
	  const otherCost = parseFloat(document.getElementById("otherCost").value) || 0;
	  const marginRate = (parseFloat(document.getElementById("margin").value) || 0) / 100;

	  const baseCost = productCost + shippingCost + otherCost;

	  let csv = "Platform,Recommended Price,Profit,Margin %,Break-even Price\n";

	  Object.entries(PLATFORM_FEES).forEach(([platform, feePercent]) => {
		const feeRate = feePercent / 100;

		if (marginRate >= 1 - feeRate) return;

		const price = baseCost / (1 - feeRate - marginRate);
		const platformFee = price * feeRate;
		const profit = price - baseCost - platformFee;
		const margin = (profit / price) * 100;
		const breakEvenPrice = baseCost / (1 - feeRate);

		csv += `${platform},${price.toFixed(2)},${profit.toFixed(2)},${margin.toFixed(1)},${breakEvenPrice.toFixed(2)}\n`;
	  });

	  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	  const url = URL.createObjectURL(blob);

	  const link = document.createElement("a");
	  link.href = url;
	  link.download = "cross-border-profit-scenarios.csv";
	  document.body.appendChild(link);
	  link.click();

	  document.body.removeChild(link);
	  URL.revokeObjectURL(url);
	}
	
    async function exportPDF() {
      if (!isPro) {
        alert("Upgrade to Pro to export reports.");
        return;
      }
    
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.setFont("Helvetica");
    
      const brandBlue = [37, 99, 235];
    
      const productCost = parseFloat(document.getElementById("productCost").value) || 0;
      const shippingCost = parseFloat(document.getElementById("shippingCost").value) || 0;
      const otherCost = parseFloat(document.getElementById("otherCost").value) || 0;
      const margin = parseFloat(document.getElementById("margin").value) || 0;
    
      const baseCost = productCost + shippingCost + otherCost;
      const marginRate = margin / 100;
    
      // ===== Header =====
      doc.setFillColor(...brandBlue);
      doc.rect(0, 0, 210, 20, "F");
    
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text("Cross-Border Profit Calculator", 14, 14);
    
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.text(`Pricing Report`, 14, 30);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 36);
    
      // ===== Cost Summary =====
      let y = 50;
      doc.setFontSize(12);
      doc.text("Cost Summary", 14, y);
      y += 8;
    
      doc.setFontSize(10);
      doc.text(`Product Cost: $${productCost.toFixed(2)}`, 14, y); y += 6;
      doc.text(`Shipping Cost: $${shippingCost.toFixed(2)}`, 14, y); y += 6;
      doc.text(`Other Cost: $${otherCost.toFixed(2)}`, 14, y); y += 6;
      doc.text(`Target Margin: ${margin}%`, 14, y); y += 10;
    
      // ===== Platform Table =====
      doc.setFontSize(12);
      doc.text("Platform Comparison", 14, y);
      y += 8;
    
      doc.setFontSize(10);
      doc.text("Platform", 14, y);
      doc.text("Price", 80, y);
      doc.text("Profit", 120, y);
      doc.text("Break-even", 160, y);
      y += 6;
    
      Object.entries(PLATFORM_FEES).forEach(([platform, fee]) => {
        const feeRate = fee / 100;
        if (marginRate >= 1 - feeRate) return;
    
        const price = baseCost / (1 - feeRate - marginRate);
        const platformFee = price * feeRate;
        const profit = price - baseCost - platformFee;
        const breakEven = baseCost / (1 - feeRate);
    
        doc.text(platform, 14, y);
        doc.text(`$${price.toFixed(2)}`, 80, y);
        doc.text(`$${profit.toFixed(2)}`, 120, y);
        doc.text(`$${breakEven.toFixed(2)}`, 160, y);
    
        y += 6;
      });
    
      // ===== AI Insights =====
      y += 10;
      doc.setFontSize(12);
      doc.text("AI Pricing Insights", 14, y);
      y += 8;
    
      doc.setFontSize(10);
      document.querySelectorAll("#aiInsights li").forEach(li => {
        doc.text("- " + li.innerText, 14, y);
        y += 6;
      });
    
      doc.save("pricing-report.pdf");
    }




    
    function loadImage(src) {
      return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
      });
    }



    function generateAIInsights() {
      if (!isPro) return;
    
      const productCost = parseFloat(document.getElementById("productCost").value) || 0;
      const shippingCost = parseFloat(document.getElementById("shippingCost").value) || 0;
      const otherCost = parseFloat(document.getElementById("otherCost").value) || 0;
      const marginRate = (parseFloat(document.getElementById("margin").value) || 0) / 100;
    
      const baseCost = productCost + shippingCost + otherCost;
      let results = [];
    
      Object.entries(PLATFORM_FEES).forEach(([platform, feePercent]) => {
        const feeRate = feePercent / 100;
        if (marginRate >= 1 - feeRate) return;
    
        const price = baseCost / (1 - feeRate - marginRate);
        const platformFee = price * feeRate;
        const profit = price - baseCost - platformFee;
        const breakEven = baseCost / (1 - feeRate);
    
        results.push({ platform, price, profit, breakEven });
      });
    
      if (results.length === 0) return;
    
      const lowestBE = results.reduce((a, b) => a.breakEven < b.breakEven ? a : b);
      const highestProfit = results.reduce((a, b) => a.profit > b.profit ? a : b);
    
      const aiBox = document.getElementById("aiInsights");
      aiBox.innerHTML = "";
    
      const insights = [
        `${lowestBE.platform} has the lowest break-even price at $${lowestBE.breakEven.toFixed(2)}.`,
        `${highestProfit.platform} offers the highest profit per unit at $${highestProfit.profit.toFixed(2)}.`
      ];
    
      insights.forEach(text => {
        const li = document.createElement("li");
        li.innerText = text;   // 注意：不用 innerHTML
        aiBox.appendChild(li);
      });
    }

    function saveScenario() {
      if (!isPro) {
        alert("Upgrade to Pro to save scenarios");
        return;
      }
    
      const name = prompt("Name this scenario:");
      if (!name) return;
    
      const scenario = {
        name,
        time: new Date().toISOString(),
        productCost: +productCost.value,
        shippingCost: +shippingCost.value,
        otherCost: +otherCost.value,
        platformFee: +platformFeePercent.value,
        margin: +margin.value
      };
    
      const list = JSON.parse(localStorage.getItem("scenarios") || "[]");
      list.push(scenario);
      localStorage.setItem("scenarios", JSON.stringify(list));
    
      renderSavedScenarios();
    }

    function renderSavedScenarios() {
      const list = JSON.parse(localStorage.getItem("scenarios") || "[]");
      const box = document.getElementById("savedList");
    
      if (!box) return;
    
      box.innerHTML = "";
    
      list.forEach((s, i) => {
        const div = document.createElement("div");
        div.style.padding = "8px";
        div.style.borderBottom = "1px solid #e5e7eb";
        div.style.cursor = "pointer";
    
        div.innerHTML = `
          <strong>${s.name}</strong><br>
          <span style="color:#6b7280;font-size:12px">
            ${new Date(s.time).toLocaleString()}
          </span>
        `;
    
        div.onclick = () => loadScenario(i);
    
        box.appendChild(div);
      });
    }

    function loadScenario(index) {
      const list = JSON.parse(localStorage.getItem("scenarios") || "[]");
      const s = list[index];
      if (!s) return;
    
      productCost.value = s.productCost;
      shippingCost.value = s.shippingCost;
      otherCost.value = s.otherCost;
      platformFeePercent.value = s.platformFee;
      margin.value = s.margin;
    
      calculate();
    }
    
    function clearScenarios() {
      if (!isPro) {
        alert("Upgrade to Pro to manage saved scenarios");
        return;
      }
    
      if (!confirm("Delete all saved scenarios? This cannot be undone.")) return;
    
      localStorage.removeItem("scenarios");
      renderSavedScenarios();
    }

    function closeUpgrade() {
      document.getElementById("upgradeModal").style.display = "none";
    }
    
    function activatePro() {
      document.getElementById("upgradeModal").style.display = "none";
      isPro = true;
      unlockProFeatures();
      alert("Pro unlocked! You now have full access.");
    }



  // 页面加载时先算一次
  calculate();
  calculateScenarios();
  renderSavedScenarios();