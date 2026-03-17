import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Oval } from "react-loader-spinner";
import { ToastContainer, toast } from "react-toastify";

import APConnector from "../services/ap-connector";

import "react-toastify/dist/ReactToastify.css";

export default function DirectLaunch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const host = searchParams.get("host");
  const slot = searchParams.get("slot");
  const password = searchParams.get("password") || "";

  useEffect(() => {
    if (!host || !slot) {
      setError("Missing required parameters: host and slot are required.");
      return;
    }

    let cancelled = false;

    async function doConnect() {
      try {
        const { permalink } = await APConnector.connect(host, slot, password);
        if (!cancelled) {
          const encodedPermalink = encodeURIComponent(permalink);
          navigate(`/tracker/new/${encodedPermalink}`, { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            `Could not connect to AP server: ${err.message || err}`,
          );
        }
      }
    }

    doConnect();

    return () => {
      cancelled = true;
    };
  }, [host, slot, password, navigate]);

  if (error) {
    return (
      <div className="full-container">
        <div className="launcher-container">
          <div className="direct-launch-error">
            <p>{error}</p>
            <a href="#/">Return to Launcher</a>
          </div>
        </div>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="full-container">
      <div className="loading-spinner">
        <Oval color="white" secondaryColor="gray" />
        <p className="connecting-message">Connecting to Archipelago server...</p>
      </div>
      <ToastContainer />
    </div>
  );
}
