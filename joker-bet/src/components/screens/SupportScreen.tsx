import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { SupportTicket } from '../../types/index';
import {
  HelpCircle,
  Send,
  MessageSquare,
  Shield,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Video,
  File,
  X,
  Eye,
  Link as LinkIcon,
  Download,
} from 'lucide-react';

export const SupportScreen: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [category, setCategory] = useState<'Deposit' | 'Withdrawal' | 'Game' | 'Other' | 'Self-Exclusion'>('Deposit');
  const [referenceId, setReferenceId] = useState('');
  const [description, setDescription] = useState('');
  
  // File upload state (Strictly Image, PDF, Video)
  const [attachmentFile, setAttachmentFile] = useState<{
    type: 'IMAGE' | 'PDF' | 'VIDEO';
    name: string;
    sizeFormatted: string;
    dataUrl: string;
  } | null>(null);


  // Preview modal for images / full media
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'IMAGE' | 'PDF' | 'VIDEO'; title: string } | null>(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadTickets = async () => {
    try {
      const res = await api.getMyTickets();
      if (res.success) {
        setTickets(res.tickets || []);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // Category dynamic labels
  const getCategoryDetails = () => {
    switch (category) {
      case 'Deposit':
        return {
          refLabel: '12-Digit Bank UTR / UPI Ref',
          refPlaceholder: 'e.g. 408512349876',
          attachmentTitle: 'Attach Payment Proof / UPI Receipt',
          attachmentHint: 'Upload screenshot, receipt PDF, or payment screen video',
          descPlaceholder: 'Provide details about date, time, paid amount, and UPI app used...',
        };
      case 'Withdrawal':
        return {
          refLabel: 'Withdrawal Ref ID / Bank A/C',
          refPlaceholder: 'e.g. wdr_1710928 or HDFC Acc',
          attachmentTitle: 'Attach Bank Statement / Passbook Proof',
          attachmentHint: 'Upload bank statement PDF, passbook photo, or account screenshot',
          descPlaceholder: 'Provide details about the requested withdrawal amount and bank status...',
        };
      case 'Game':
        return {
          refLabel: 'Game Table / Room Tier',
          refPlaceholder: 'e.g. Gold Classic or Tier #100',
          attachmentTitle: 'Attach Game Board Proof',
          attachmentHint: 'Upload game outcome screenshot, screen recording video, or round log',
          descPlaceholder: 'Explain the card reveal dispute or table disconnection query...',
        };
      case 'Self-Exclusion':
        return {
          refLabel: 'Account Username or Mobile',
          refPlaceholder: 'e.g. @your_username or +91...',
          attachmentTitle: 'Attach Identity Verification Document',
          attachmentHint: 'Upload ID card photo (Image or PDF) to verify self-exclusion request',
          descPlaceholder: 'State your requested exclusion cooling-off duration (e.g. 7 days, 1 month, permanent)...',
        };
      default:
        return {
          refLabel: 'Reference ID (Optional)',
          refPlaceholder: 'e.g. Transaction or Ticket ID',
          attachmentTitle: 'Attach Supporting Document / Proof',
          attachmentHint: 'Upload supporting Image, PDF document, or Video',
          descPlaceholder: 'Describe your query or feedback in detail...',
        };
    }
  };

  const details = getCategoryDetails();

  // Strict file type validation (Only Image, PDF, Video)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const mime = file.type.toLowerCase();
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    let mediaType: 'IMAGE' | 'PDF' | 'VIDEO' | null = null;

    if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
      mediaType = 'IMAGE';
    } else if (mime === 'application/pdf' || ext === 'pdf') {
      mediaType = 'PDF';
    } else if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv'].includes(ext)) {
      mediaType = 'VIDEO';
    }

    if (!mediaType) {
      setMsg({
        type: 'error',
        text: 'Invalid file format! Only Image (PNG, JPG, WEBP), PDF documents, and Video (MP4, WEBM) files are permitted.',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Check size (Max 25MB)
    const maxBytes = 25 * 1024 * 1024;
    if (file.size > maxBytes) {
      setMsg({
        type: 'error',
        text: 'File exceeds maximum 25MB limit. Please attach a compressed image, PDF, or video.',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentFile({
        type: mediaType!,
        name: file.name,
        sizeFormatted,
        dataUrl: reader.result as string,
      });
      setMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setAttachmentFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setMsg({ type: 'error', text: 'Please write a brief description of your issue' });
      return;
    }

    setMsg(null);
    setLoading(true);
    try {
      const res = await api.createTicket({
        category,
        referenceId: referenceId.trim() || undefined,
        description: description.trim(),
        attachmentType: attachmentFile?.type,
        attachmentName: attachmentFile?.name,
        attachmentData: attachmentFile?.dataUrl,
      });

      if (res.success) {
        setMsg({ type: 'success', text: res.message });
        setDescription('');
        setReferenceId('');
        setAttachmentFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await loadTickets();
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to submit ticket' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-white font-['Cinzel'] tracking-wide flex items-center gap-2.5">
          <MessageSquare className="w-6 h-6 text-amber-400" />
          <span>Customer Support & Operations Desk</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          24/7 dedicated assistance for deposit UTR verification, payout settlements, game inquiries & self-exclusion
        </p>
      </div>

      {/* Feedback banner */}
      {msg && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs leading-relaxed animate-in fade-in ${
            msg.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/15 border-red-500/40 text-red-300'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Ticket Submission Card */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 rounded-3xl bg-[#0c101c] border border-slate-800 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <Send className="w-4 h-4 text-amber-400" />
            <span>Create New Operational Ticket</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Average Response Time: &lt; 15 Mins
          </span>
        </div>

        {/* Category & Reference ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
              Issue Category
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as any);
                setAttachmentFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="w-full bg-[#07090e] border border-slate-700 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
            >
              <option value="Deposit">Deposit / UTR Delay</option>
              <option value="Withdrawal">Withdrawal / Bank Transfer</option>
              <option value="Game">Game Outcome Query</option>
              <option value="Self-Exclusion">Self-Exclusion / Responsible Gaming</option>
              <option value="Other">General Account Inquiry</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
              {details.refLabel}
            </label>
            <input
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder={details.refPlaceholder}
              className="w-full bg-[#07090e] border border-slate-700 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
        </div>

        {/* Detailed Description */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
            Detailed Explanation
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={details.descPlaceholder}
            className="w-full bg-[#07090e] border border-slate-700 rounded-2xl p-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 leading-relaxed"
          />
        </div>

        {/* Dynamic Attachment Section: Strict Upload (Image, PDF, Video ONLY) */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              {details.attachmentTitle}
            </label>
            <span className="text-[11px] text-slate-400">
              {details.attachmentHint} • <strong className="text-amber-400/90 font-medium">Image, PDF, or Video ONLY</strong> (Max 25MB)
            </span>
          </div>

          <div>
            {!attachmentFile ? (
              /* File Dropzone / Picker */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-slate-700 hover:border-amber-500/70 rounded-2xl bg-[#07090e] text-center cursor-pointer transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-3 text-slate-400 group-hover:text-amber-300 transition-colors mb-2">
                  <ImageIcon className="w-5 h-5 text-emerald-400" />
                  <FileText className="w-5 h-5 text-red-400" />
                  <Video className="w-5 h-5 text-sky-400" />
                </div>
                <div className="text-xs font-bold text-slate-300 group-hover:text-amber-200">
                  Click to browse or drop Image, PDF, or Video file here
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                  Supported: JPG, PNG, WEBP • PDF Documents • MP4, WEBM Videos
                </div>
              </div>
            ) : (
              /* Selected File Preview Card */
              <div className="p-4 rounded-2xl bg-[#07090e] border border-amber-500/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 border border-slate-800">
                    {attachmentFile.type === 'IMAGE' && <ImageIcon className="w-5 h-5 text-emerald-400" />}
                    {attachmentFile.type === 'PDF' && <FileText className="w-5 h-5 text-red-400" />}
                    {attachmentFile.type === 'VIDEO' && <Video className="w-5 h-5 text-sky-400" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate font-mono">
                      {attachmentFile.name}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span className="uppercase font-bold text-amber-400">{attachmentFile.type}</span>
                      <span>•</span>
                      <span>{attachmentFile.sizeFormatted}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {attachmentFile.type === 'IMAGE' && (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewMedia({
                          url: attachmentFile.dataUrl,
                          type: 'IMAGE',
                          title: attachmentFile.name,
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleRemoveAttachment}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                    title="Remove Attachment"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !description.trim()}
          className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          <span>{loading ? 'Submitting to Operations Queue...' : 'Submit Support Ticket'}</span>
        </button>
      </form>

      {/* Ticket History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Your Submitted Tickets ({tickets.length})</span>
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">Updates in real-time</span>
        </div>

        {tickets.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-[#090d16] rounded-3xl border border-slate-800">
            No support tickets submitted yet. Your resolved disputes and UTR queries will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div key={t.id} className="p-5 rounded-3xl bg-[#0c101c] border border-slate-800 shadow-xl space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-300 text-sm">
                      [{t.category}]
                    </span>
                    {t.referenceId && (
                      <span className="font-mono text-slate-400 text-[11px]">
                        Ref: #{t.referenceId}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(t.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'RESOLVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : t.status === 'UNDER_REVIEW'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                          : 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/30'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-slate-300 leading-relaxed bg-[#07090e] p-3 rounded-2xl border border-slate-800/80">
                  {t.description}
                </p>

                {/* Attachment Display */}
                {(t.attachmentData || t.screenshotUrl) && (
                  <div className="p-3 rounded-2xl bg-[#090d16] border border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {t.attachmentType === 'PDF' ? (
                        <FileText className="w-5 h-5 text-red-400 shrink-0" />
                      ) : t.attachmentType === 'VIDEO' ? (
                        <Video className="w-5 h-5 text-sky-400 shrink-0" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-slate-200 text-xs">
                          {t.attachmentName || 'Supporting Attachment'}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">
                          Format: {t.attachmentType || 'Image Link'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setPreviewMedia({
                          url: t.attachmentData || t.screenshotUrl || '',
                          type: t.attachmentType || 'IMAGE',
                          title: t.attachmentName || `Ticket #${t.id} Attachment`,
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>View File</span>
                    </button>
                  </div>
                )}

                {/* Operational Replies Thread */}
                {t.replies && t.replies.length > 1 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Operations Desk Updates:
                    </div>
                    {t.replies.slice(1).map((r, ri) => (
                      <div
                        key={ri}
                        className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-amber-400 uppercase">[Operations Desk]:</span>
                          <span className="text-slate-500 font-mono">
                            {new Date(r.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="leading-relaxed">{r.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Media Preview Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-[#0d121c] border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-white text-sm truncate pr-2">{previewMedia.title}</span>
              <button
                onClick={() => setPreviewMedia(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto flex items-center justify-center rounded-2xl bg-black p-2">
              {previewMedia.type === 'IMAGE' && (
                <img
                  src={previewMedia.url}
                  alt="Attachment Preview"
                  className="max-h-[65vh] object-contain rounded-xl"
                />
              )}
              {previewMedia.type === 'VIDEO' && (
                <video
                  src={previewMedia.url}
                  controls
                  autoPlay
                  className="max-h-[65vh] w-full rounded-xl"
                />
              )}
              {previewMedia.type === 'PDF' && (
                <div className="p-8 text-center space-y-4">
                  <FileText className="w-16 h-16 text-red-400 mx-auto" />
                  <div className="text-sm font-bold text-white">PDF Document Attached</div>
                  <a
                    href={previewMedia.url}
                    download={previewMedia.title || 'document.pdf'}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download / Open PDF</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPreviewMedia(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
