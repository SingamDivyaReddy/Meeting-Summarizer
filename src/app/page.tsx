"use client";
import { useState } from "react";

export default function HomePage() {
  const [transcript, setTranscript] = useState("");
  const [prompt, setPrompt] = useState("Summarize in bullet points for executives");
  const [summary, setSummary] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [recipients, setRecipients] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [sentToEmails, setSentToEmails] = useState<string[]>([]);
  const [emailError, setEmailError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        let text = '';
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          text = await file.text();
        } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          setStatusMessage("Processing PDF file...");
          const formData = new FormData();
          formData.append('file', file);
          const response = await fetch('/api/parse-pdf', { method: 'POST', body: formData });
          if (!response.ok) throw new Error('Failed to parse PDF file.');
          const data = await response.json();
          text = data.text;
        } else if (
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.type === 'application/msword' ||
          file.name.endsWith('.docx') ||
          file.name.endsWith('.doc')
        ) {
          setStatusMessage("Processing Word document...");
          const formData = new FormData();
          formData.append('file', file);
          const response = await fetch('/api/parse-word', { method: 'POST', body: formData });
          if (!response.ok) throw new Error('Failed to parse Word document.');
          const data = await response.json();
          text = data.text;
        } else {
          throw new Error('Unsupported file type. Please upload a .txt, .pdf, .doc, or .docx file.');
        }
        setTranscript(text);
        setStatusMessage(`File "${file.name}" processed successfully!`);
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : "Failed to process file.");
        console.error('File processing error:', error);
      }
    }
  };

  const handleGenerateSummary = async () => {
    if (!transcript) {
      setStatusMessage("Please upload a transcript first.");
      return;
    }
    setIsLoading(true);
    setStatusMessage("Generating summary...");
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, prompt }),
      });
      if (!response.ok) throw new Error("Failed to generate summary.");
      const data = await response.json();
      setSummary(data.summary);
      setStatusMessage("Summary generated successfully!");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareEmail = async () => {
    if (!summary || !recipients) {
      setStatusMessage("Please generate a summary and enter recipient emails.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipientList = recipients.split(',').map(email => email.trim());
    const invalidEmails = recipientList.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      setErrorMessage(`Invalid email format: ${invalidEmails.join(', ')}`);
      setEmailError(true);
      setTimeout(() => {
        setEmailError(false);
        setErrorMessage("");
      }, 5000);
      return;
    }
    setIsSendingEmail(true);
    setStatusMessage("Sending email...");
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary, recipients }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email.');
      }
      const data = await response.json();
      setStatusMessage(data.message);
      setRecipients("");
      setSentToEmails(recipientList);
      setEmailSent(true);
      setTimeout(() => {
        setEmailSent(false);
        setSentToEmails([]);
      }, 5000);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "An unknown error occurred.");
      setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred.");
      setEmailError(true);
      setTimeout(() => {
        setEmailError(false);
        setErrorMessage("");
      }, 5000);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 font-sans">
      <h1 className="text-3xl font-bold text-center mb-6">AI Meeting Summarizer</h1>
      <div
        style={{
          background: '#fff',
          border: '2px solid #222',
          padding: '24px',
          margin: '32px 0',
          borderRadius: '14px',
          color: '#222',
          fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          letterSpacing: '0.01em',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '1.18rem', display: 'block', marginBottom: '12px' }}>
          PDF Upload Notice
        </span>
        <span style={{ fontSize: '1.04rem', lineHeight: '1.8', display: 'block', marginBottom: '14px' }}>
          If your meeting notes are in PDF format, please convert them to text (.txt) or Word (.docx) documents before uploading.
        </span>
        <button
          onClick={() => setShowGuide(true)}
          style={{
            color: '#fff',
            background: '#111',
            padding: '10px 20px',
            borderRadius: '7px',
            border: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
            cursor: 'pointer',
            marginTop: '10px',
            fontFamily: 'Inter, Segoe UI, Arial, sans-serif'
          }}
        >
          Manual Conversion Guide: All Ways to Convert PDF
        </button>
      </div>

      {showGuide && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setShowGuide(false)}
        >
          <div
            style={{
              background: '#fff',
              color: '#222',
              padding: '32px',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowGuide(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                color: '#222',
                cursor: 'pointer'
              }}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '16px' }}>Manual Conversion Guide</h2>
            <ol style={{ fontSize: '1rem', color: '#333', lineHeight: '1.7' }}>
              <li>
                <b>Online Tools:</b> Use <a href="https://www.ilovepdf.com/pdf_to_word" target="_blank" rel="noopener noreferrer">ilovepdf.com/pdf_to_word</a> for PDF to Word, or <a href="https://www.pdf2go.com/pdf-to-text" target="_blank" rel="noopener noreferrer">pdf2go.com/pdf-to-text</a> for PDF to Text.
              </li>
              <li>
                <b>Adobe Acrobat:</b> Open your PDF in Adobe Acrobat, go to <i>File &gt; Export To &gt; Microsoft Word</i> or <i>Text</i>.
              </li>
              <li>
                <b>Google Docs:</b> Upload your PDF to Google Drive, open with Google Docs, then download as Word or Text.
              </li>
              <li>
                <b>Manual Copy:</b> Open the PDF, select all text, copy and paste into Notepad or Word.
              </li>
            </ol>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Step 1: Upload & Prompt */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">1. Provide Transcript & Instructions</h2>
          <div className="flex items-center mb-4">
            <label htmlFor="file-upload" className="cursor-pointer bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">
              Upload Transcript (.txt, .doc, .docx)
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".txt,.pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Or paste your transcript here..."
            className="w-full h-40 p-2 border rounded-lg"
          />
          <label htmlFor="prompt" className="block mt-4 mb-2 font-medium">Custom Instruction:</label>
          <input
            id="prompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
        </div>

        {/* Step 2: Generate */}
        <div className="text-center">
          <button
            onClick={handleGenerateSummary}
            disabled={isLoading}
            className="bg-white text-black font-bold py-2 px-6 rounded-lg disabled:bg-gray-600 hover:bg-gray-800"
          >
            {isLoading ? "Generating..." : "Generate Summary"}
          </button>
        </div>

        {/* Step 3: Edit & Share */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">2. Edit and Share Summary</h2>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Your generated summary will appear here..."
            className="w-full h-48 p-2 border rounded-lg"
          />
          <label htmlFor="recipients" className="block mt-4 mb-2 font-medium">Recipient Emails (comma-separated):</label>
          <input
            id="recipients"
            type="text"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            placeholder="email1@example.com, email2@example.com"
            className="w-full p-2 border rounded-lg"
          />
          <p className="text-sm text-gray-500 mt-1">
            Enter email addresses separated by commas. Example: john@company.com, jane@company.com
          </p>
          <button
            onClick={handleShareEmail}
            disabled={isSendingEmail}
            className="mt-4 bg-white text-black font-bold py-2 px-6 rounded-lg hover:bg-gray-800 disabled:bg-gray-600"
          >
            {isSendingEmail ? "Sending..." : "Share via Email"}
          </button>
        </div>

        {statusMessage && <p className="text-center text-gray-600 mt-4">{statusMessage}</p>}

        {/* Success Notification */}
        {emailSent && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Email Sent Successfully!</p>
                <p className="text-xs mt-1">
                  Sent to: {sentToEmails.join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {emailError && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Error Sending Email!</p>
                <p className="text-xs mt-1">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
  );
}