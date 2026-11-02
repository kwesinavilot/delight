/** Packaged, read-only checks. No selectors or executable code supplied by models. */
export function siteVerification(request: { kind: string; query?: string; subject?: string; recipient?: string; videoId?: string }) {
  const url = new URL(location.href);
  if (request.kind === 'googleSearch') {
    if (!/(^|\.)google\.com$/.test(url.hostname) || url.pathname !== '/search' ||
        !request.query?.trim() || url.searchParams.get('q') !== request.query) throw new Error('Google search URL does not match the requested query');
    const results = document.querySelector('#search, #rso');
    const links = results ? Array.from(results.querySelectorAll('a[href]')).filter(el => /^https?:/.test((el as HTMLAnchorElement).href)) : [];
    if (!links.length) throw new Error('Google results have not rendered; a search URL alone is not confirmation');
    return { kind: request.kind, verified: true, evidence: 'Matching search query and rendered result links observed' };
  }
  if (request.kind === 'gmailSent') {
    if (url.hostname !== 'mail.google.com' || !/^#sent(?:\/|$)/.test(url.hash)) throw new Error('Inspect the Gmail Sent folder before verifying a sent message');
    if (!request.subject?.trim() || !request.recipient?.trim()) throw new Error('Gmail confirmation requires the expected subject and recipient');
    const rows = Array.from(document.querySelectorAll('tr.zA, [role=row]'));
    const matches = rows.filter(row => {
      const subject = row.querySelector('.bog, [data-thread-subject]')?.textContent?.trim();
      const recipients = Array.from(row.querySelectorAll('[email]')).map(el => el.getAttribute('email')?.toLowerCase());
      return subject === request.subject && recipients.includes(request.recipient!.toLowerCase());
    });
    const row = matches.length === 1 ? matches[0] : undefined;
    const thread = row?.getAttribute('data-legacy-thread-id') || row?.querySelector('[data-legacy-thread-id]')?.getAttribute('data-legacy-thread-id');
    if (!thread) throw new Error('No unique Sent thread matches both subject and recipient; delivery remains unconfirmed');
    return { kind: request.kind, verified: true, threadId: thread, evidence: 'Unique Gmail Sent thread matched subject and recipient; recipient delivery is not guaranteed' };
  }
  if (request.kind === 'youtubePlayback') {
    if (!/(^|\.)youtube\.com$/.test(url.hostname) || url.pathname !== '/watch' || !url.searchParams.get('v') ||
        (request.videoId && url.searchParams.get('v') !== request.videoId)) throw new Error('YouTube watch page does not match the requested video');
    const video = document.querySelector('video');
    if (!video || video.paused || video.ended || video.readyState < 2 || document.querySelector('.ad-showing')) throw new Error('Content playback has not been verified (paused, buffering, or advertisement)');
    return { kind: request.kind, verified: false, videoId: url.searchParams.get('v'), time: video.currentTime, evidence: 'Playback must advance across observations' };
  }
  throw new Error('Unsupported site verification');
}
