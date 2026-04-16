# Hanoi Intelligence Platform — APEX Edition

> **The God-Tier Sentinel Oracle for Probabilistic Intelligence.**  
> An autonomous, self-healing, and financially intelligent statistical engine designed for the high-end analysis of Hanoi lottery markets.

![Engine Version](https://img.shields.io/badge/Engine-APEX--V2.1-blueviolet?style=for-the-badge)
![Status](https://img.shields.io/badge/System-Fortress_Active-emerald?style=for-the-badge)
![Agentic](https://img.shields.io/badge/Agent-Oracle_Bot-336791?style=for-the-badge)

---

## 🏛️ The Four Pillars of the Apex Platform

### 1. 🧠 The Truth Engine (v2.1)
The core analytical brain. It doesn't just count numbers; it performs a **6-stage verification pipeline**:
- **Integrity Check**: Detects data corruption or missing entries.
- **Deep Feature Engineering**: Extracts momentum, gaps, weekday parity, and structural repeaters.
- **Genetic Self-Optimization**: Automatically recalibrates weight scoring when market conditions shift.
- **Walk-Forward Backtesting**: Continuously validates accuracy against historical data to prevent overclaiming.

### 2. 🛰️ The Sentinel (Market Drift Defense)
An autonomous resilience layer that protects you from "Market Drift":
- **Volatility Indexing**: Measures the acceleration of pattern shifts.
- **Global Anomaly Alerts**: Pushes high-priority Telegram warnings if multiple markets (Normal, VIP, Special) begin to drift simultaneously.
- **Adaptive Hardening**: Automatically reduces prediction confidence during unstable market periods.

### 3. 💸 The Financial Edge (Stewardship)
Turns statistical data into actionable financial strategy:
- **Kelly Criterion**: Calculates the mathematically optimal stake for each market to maximize log-growth.
- **Monte Carlo Simulations**: Visualizes 1,000 parallel futures to estimate Max Drawdowns and ROI expectations over a 30-day horizon.

### 4. 🔮 The Oracle (Agentic Interface)
The system is fully interactive via your private Telegram Command Center:
- `/predict [type]` — Instant high-density intelligence.
- `/radar [type]` — Real-time numerical momentum heatmaps.
- `/risk [type]` — Detailed ROI and Risk Management reports.
- `/status` — Holistic system and financial health check.

---

## 🛡️ The Fortress (System Resilience)
Designed for 100% uptime with zero maintenance:
- **Self-Healing Scraper**: Automated 3-stage retry logic with exponential backoff for data ingestion.
- **Dead-Man's Switch**: Critical notification if the system fails to ingest new data for 24 hours.
- **Webhook Security**: Hardened using the Telegram-native `secret_token` protocol to prevent spoofing.

---

## 🚀 Environment Configuration

| Variable | Requirement |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL Connection String (Railway/Supabase) |
| `TELEGRAM_BOT_TOKEN` | Your Telegram Bot Token from @BotFather |
| `TELEGRAM_CHAT_ID` | Your Private Chat ID |
| `TELEGRAM_SECRET` | Secret token for Webhook Security |
| `CRON_SECRET` | Secret token for secure sync triggers |
| `NEXT_PUBLIC_APP_URL` | Your public deployment URL |

---

## 🏗️ Deployment Guide

1.  **Deploy to Railway**: Connect your GitHub repository.
2.  **Add PostgreSQL**: provision a DB and link the `DATABASE_URL`.
3.  **Set Secrets**: Input the environment variables above.
4.  **Initialize**: Call `/api/cron/sync-daily?setup_webhook=true` once to link the Oracle.

---

## ⚠️ Disclaimer
**This platform is a statistical analysis tool only. It does not guarantee financial outcomes and should not be used as gambling advice. All numerical outputs are probabilistic calculations based on historical data.**

---

**Mission Status: COMPLETE. Engine Status: APEX.**
