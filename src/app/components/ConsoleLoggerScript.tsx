"use client";

import { useEffect } from "react";

export default function ConsoleLoggerScript() {
  useEffect(() => {
    // Create console container
    const container = document.createElement("div");
    container.id = "console-logger-container";
    container.style.position = "fixed";
    container.style.bottom = "20px";
    container.style.right = "20px";
    container.style.zIndex = "99999";
    document.body.appendChild(container);

    // Create button
    const button = document.createElement("button");
    button.innerText = "LOG";
    button.style.backgroundColor = "#3B82F6"; // blue-500
    button.style.color = "white";
    button.style.border = "2px solid white";
    button.style.borderRadius = "6px";
    button.style.padding = "8px 12px";
    button.style.fontWeight = "bold";
    button.style.cursor = "pointer";
    button.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
    button.style.transition = "all 0.2s";
    button.style.width = "60px";
    button.style.height = "60px";
    button.style.display = "flex";
    button.style.alignItems = "center";
    button.style.justifyContent = "center";
    container.appendChild(button);

    // Create logs panel (initially hidden)
    const logsPanel = document.createElement("div");
    logsPanel.style.position = "fixed";
    logsPanel.style.bottom = "90px";
    logsPanel.style.right = "20px";
    logsPanel.style.left = "20px";
    logsPanel.style.backgroundColor = "white";
    logsPanel.style.border = "2px solid #3B82F6";
    logsPanel.style.borderRadius = "8px";
    logsPanel.style.boxShadow = "0 10px 15px rgba(0, 0, 0, 0.1)";
    logsPanel.style.maxHeight = "50vh";
    logsPanel.style.overflowY = "auto";
    logsPanel.style.display = "none";
    logsPanel.style.zIndex = "99999";
    document.body.appendChild(logsPanel);

    // Create header
    const header = document.createElement("div");
    header.style.padding = "8px";
    header.style.backgroundColor = "#3B82F6";
    header.style.color = "white";
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    logsPanel.appendChild(header);

    // Title
    const title = document.createElement("div");
    title.innerText = "Console Logs";
    title.style.fontWeight = "bold";
    header.appendChild(title);

    // Buttons container
    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.display = "flex";
    buttonsContainer.style.gap = "8px";
    header.appendChild(buttonsContainer);

    // Clear button
    const clearButton = document.createElement("button");
    clearButton.innerText = "Clear";
    clearButton.style.padding = "4px 8px";
    clearButton.style.backgroundColor = "white";
    clearButton.style.color = "#3B82F6";
    clearButton.style.border = "none";
    clearButton.style.borderRadius = "4px";
    clearButton.style.cursor = "pointer";
    buttonsContainer.appendChild(clearButton);

    // Close button
    const closeButton = document.createElement("button");
    closeButton.innerText = "Close";
    closeButton.style.padding = "4px 8px";
    closeButton.style.backgroundColor = "white";
    closeButton.style.color = "#3B82F6";
    closeButton.style.border = "none";
    closeButton.style.borderRadius = "4px";
    closeButton.style.cursor = "pointer";
    buttonsContainer.appendChild(closeButton);

    // Content area
    const logsContent = document.createElement("div");
    logsContent.id = "console-logs-content";
    logsContent.style.padding = "8px";
    logsContent.style.height = "240px";
    logsContent.style.overflowY = "auto";
    logsContent.style.fontFamily = "monospace";
    logsContent.style.fontSize = "12px";
    logsPanel.appendChild(logsContent);

    // Add initial message
    const initialMessage = document.createElement("div");
    initialMessage.innerText = "Console logger ready";
    initialMessage.style.color = "#888";
    initialMessage.style.fontStyle = "italic";
    logsContent.appendChild(initialMessage);

    // Indicator dot
    const indicator = document.createElement("span");
    indicator.style.position = "absolute";
    indicator.style.top = "0";
    indicator.style.right = "0";
    indicator.style.width = "12px";
    indicator.style.height = "12px";
    indicator.style.backgroundColor = "#EF4444"; // red-500
    indicator.style.borderRadius = "50%";
    indicator.style.display = "none";
    button.appendChild(indicator);

    // Event listeners
    button.addEventListener("click", () => {
      if (logsPanel.style.display === "none") {
        logsPanel.style.display = "block";
        indicator.style.display = "none";
      } else {
        logsPanel.style.display = "none";
      }
    });

    closeButton.addEventListener("click", () => {
      logsPanel.style.display = "none";
    });

    clearButton.addEventListener("click", () => {
      logsContent.innerHTML = "";
      const clearMessage = document.createElement("div");
      clearMessage.innerText = "Logs cleared";
      clearMessage.style.color = "#888";
      clearMessage.style.fontStyle = "italic";
      logsContent.appendChild(clearMessage);
    });

    // Hook console methods
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
    };

    console.log = function (...args: unknown[]) {
      addLogEntry(args, "log");
      originalConsole.log.apply(console, args);
    };

    console.error = function (...args: unknown[]) {
      addLogEntry(args, "error");
      originalConsole.error.apply(console, args);
    };

    console.warn = function (...args: unknown[]) {
      addLogEntry(args, "warn");
      originalConsole.warn.apply(console, args);
    };

    console.info = function (...args: unknown[]) {
      addLogEntry(args, "info");
      originalConsole.info.apply(console, args);
    };

    function addLogEntry(args: unknown[], type: string) {
      // Show indicator
      indicator.style.display = "block";

      // Format message
      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        )
        .join(" ");

      // Create log entry
      const entry = document.createElement("div");
      entry.style.marginBottom = "4px";

      // Style based on type
      switch (type) {
        case "error":
          entry.style.color = "#DC2626"; // red-600
          break;
        case "warn":
          entry.style.color = "#D97706"; // amber-600
          break;
        case "info":
          entry.style.color = "#2563EB"; // blue-600
          break;
        default:
          entry.style.color = "#1F2937"; // gray-800
      }

      entry.innerText = `[${type}] ${message}`;
      logsContent.appendChild(entry);

      // Auto-scroll to bottom
      logsContent.scrollTop = logsContent.scrollHeight;
    }

    // Log a test message
    console.log("Console logger initialized");

    // Cleanup function
    return () => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;

      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      if (document.body.contains(logsPanel)) {
        document.body.removeChild(logsPanel);
      }
    };
  }, []);

  // This component doesn't render anything visible in React
  // It's all created through direct DOM manipulation
  return null;
}
