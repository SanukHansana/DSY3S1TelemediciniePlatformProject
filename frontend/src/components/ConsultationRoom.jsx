import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { getAppointment } from "../services/appointmentApi";
import {
  completeSession,
  createOrGetSession,
  logSessionEvent
} from "../services/telemedicineApi";

const loadJitsiScript = () =>
  new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) {
      resolve(window.JitsiMeetExternalAPI);
      return;
    }

    const existingScript = document.querySelector(
      'script[data-jitsi-external-api="true"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () =>
        resolve(window.JitsiMeetExternalAPI)
      );
      existingScript.addEventListener("error", () =>
        reject(new Error("Could not load the Jitsi script"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.dataset.jitsiExternalApi = "true";
    script.onload = () => resolve(window.JitsiMeetExternalAPI);
    script.onerror = () =>
      reject(new Error("Could not load the Jitsi script"));
    document.body.appendChild(script);
  });

export default function ConsultationRoom() {
  const { appointmentId } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") === "doctor" ? "doctor" : "patient";

  const [appointment, setAppointment] = useState(null);
  const [participantName, setParticipantName] = useState(
    role === "doctor" ? "Dr. Demo User" : "Patient Demo User"
  );
  const [sessionPayload, setSessionPayload] = useState(null);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const jitsiApiRef = useRef(null);
  const jitsiContainerRef = useRef(null);
  const participantIdRef = useRef(`${role}-${Date.now()}`);

  useEffect(() => {
    const loadAppointment = async () => {
      try {
        const data = await getAppointment(appointmentId);
        setAppointment(data);
      } catch (loadError) {
        setError(loadError.message || "Could not load appointment");
      }
    };

    loadAppointment();
  }, [appointmentId]);

  useEffect(() => {
    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setParticipantName(role === "doctor" ? "Dr. Demo User" : "Patient Demo User");
    participantIdRef.current = `${role}-${Date.now()}`;
    setSessionPayload(null);
    setInfoMessage("");
    setError("");

    if (jitsiApiRef.current) {
      jitsiApiRef.current.dispose();
      jitsiApiRef.current = null;
    }
  }, [role]);

  const handleJoinMeeting = async () => {
    if (!participantName.trim()) {
      setError("Please enter a display name before joining");
      return;
    }

    setIsJoining(true);
    setError("");
    setInfoMessage("");

    try {
      const payload = await createOrGetSession(appointmentId, {
        participantId: participantIdRef.current,
        participantName: participantName.trim(),
        participantRole: role
      });

      setSessionPayload(payload);

      const JitsiMeetExternalAPI = await loadJitsiScript();

      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }

      const api = new JitsiMeetExternalAPI(payload.embed.domain, {
        roomName: payload.embed.roomName,
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: participantName.trim()
        },
        configOverwrite: {
          prejoinPageEnabled: true,
          disableDeepLinking: true
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false
        }
      });

      api.addListener("videoConferenceJoined", async () => {
        setInfoMessage("Connected to the consultation room.");
        setSessionPayload((current) =>
          current
            ? {
                ...current,
                session: {
                  ...current.session,
                  status: "live"
                }
              }
            : current
        );
        await logSessionEvent(payload.session.id, {
          eventType: "conference_joined",
          participantId: participantIdRef.current,
          participantName: participantName.trim(),
          participantRole: role
        });
      });

      api.addListener("videoConferenceLeft", async () => {
        setInfoMessage("You left the consultation room.");
        await logSessionEvent(payload.session.id, {
          eventType: "conference_left",
          participantId: participantIdRef.current,
          participantName: participantName.trim(),
          participantRole: role
        });
      });

      jitsiApiRef.current = api;
    } catch (joinError) {
      setError(joinError.message || "Could not start the consultation");
    } finally {
      setIsJoining(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!sessionPayload?.session?.id) {
      setError("Join the consultation room before finishing the session");
      return;
    }

    setIsEnding(true);
    setError("");

    try {
      const response = await completeSession(sessionPayload.session.id, {
        participantId: participantIdRef.current,
        participantName: participantName.trim(),
        participantRole: role
      });

      setSessionPayload((current) =>
        current
          ? {
              ...current,
              session: response.session
            }
          : current
      );
      setInfoMessage("Session marked as completed.");

      if (jitsiApiRef.current) {
        jitsiApiRef.current.executeCommand("hangup");
      }
    } catch (completeError) {
      setError(completeError.message || "Could not finish the session");
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <section className="panel consultation-layout">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Telemedicine Session</p>
          <h2>{role === "doctor" ? "Doctor console" : "Patient console"}</h2>
        </div>

        <Link className="ghost-link" to="/">
          Back to appointments
        </Link>
      </div>

      <div className="consultation-meta">
        <div className="summary-card">
          <span className="summary-label">Appointment ID</span>
          <strong>{appointmentId}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Current role</span>
          <strong>{role}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Scheduled for</span>
          <strong>
            {appointment?.scheduled_at
              ? new Date(appointment.scheduled_at).toLocaleString()
              : "Loading..."}
          </strong>
        </div>
      </div>

      <div className="consultation-grid">
        <div className="consultation-sidebar">
          <label>
            <span>Display name</span>
            <input
              value={participantName}
              onChange={(event) => setParticipantName(event.target.value)}
              placeholder="Enter your name"
            />
          </label>

          <p className="form-hint">
            A Jitsi room will be created once for this appointment and reused by
            both the doctor and patient.
          </p>

          {sessionPayload?.session ? (
            <div className="session-box">
              <p>
                <strong>Provider:</strong> {sessionPayload.session.provider}
              </p>
              <p>
                <strong>Room:</strong> {sessionPayload.session.roomName}
              </p>
              <p>
                <strong>Status:</strong> {sessionPayload.session.status}
              </p>
            </div>
          ) : null}

          <div className="card-actions stacked">
            <button
              className="primary-button"
              onClick={handleJoinMeeting}
              disabled={isJoining}
              type="button"
            >
              {isJoining ? "Joining..." : "Open video consultation"}
            </button>

            <button
              className="secondary-button"
              onClick={handleCompleteSession}
              disabled={isEnding}
              type="button"
            >
              {isEnding ? "Finishing..." : "Mark session completed"}
            </button>
          </div>

          {infoMessage ? <p className="status-message success">{infoMessage}</p> : null}
          {error ? <p className="status-message error">{error}</p> : null}
        </div>

        <div className="meeting-stage">
          <div className="jitsi-container" ref={jitsiContainerRef}>
            {!sessionPayload ? (
              <div className="jitsi-placeholder">
                <p>The meeting frame will appear here after you join.</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
