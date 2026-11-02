const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { siteVerification } = require('./load-typescript.cjs')('src/services/automation/SiteVerification.ts');
function fixture(url, html) {
  const dom = new JSDOM(html, { url });
  global.location = dom.window.location; global.document = dom.window.document;
  return dom;
}
test('Google confirmation requires matching query and rendered result links', () => {
  const dom = fixture('https://www.google.com/search?q=cats', '<div id="search"></div>');
  assert.throws(() => siteVerification({ kind: 'googleSearch', query: 'cats' }), /not rendered/);
  document.querySelector('#search').innerHTML = '<a href="https://example.com/cats">Cats</a>';
  assert.equal(siteVerification({ kind: 'googleSearch', query: 'cats' }).verified, true);
  assert.throws(() => siteVerification({ kind: 'googleSearch', query: 'dogs' }), /does not match/);
  dom.window.close();
});
test('Gmail confirmation requires Sent route, exact subject, recipient and a unique thread', () => {
  const dom = fixture('https://mail.google.com/mail/u/0/#sent', '<table><tr class="zA" data-legacy-thread-id="thread1"><td><span class="bog">Hello</span><span email="friend@example.com">Friend</span></td></tr></table>');
  const request = { kind: 'gmailSent', subject: 'Hello', recipient: 'friend@example.com' };
  assert.equal(siteVerification(request).threadId, 'thread1');
  assert.throws(() => siteVerification({ ...request, recipient: 'wrong@example.com' }), /No unique/);
  location.hash = '#inbox';
  assert.throws(() => siteVerification(request), /Sent folder/);
  location.hash = '#sent';
  document.querySelector('table').append(document.querySelector('tr').cloneNode(true));
  assert.throws(() => siteVerification(request), /No unique/);
  dom.window.close();
});
test('YouTube check rejects advertising, paused media and wrong video identity', () => {
  const dom = fixture('https://www.youtube.com/watch?v=abc', '<video></video>');
  const video = document.querySelector('video');
  Object.defineProperties(video, { paused: { value: false }, readyState: { value: 3 } });
  video.currentTime = 12;
  assert.equal(siteVerification({ kind: 'youtubePlayback', videoId: 'abc' }).time, 12);
  assert.throws(() => siteVerification({ kind: 'youtubePlayback', videoId: 'wrong' }), /does not match/);
  document.body.className = 'ad-showing';
  assert.throws(() => siteVerification({ kind: 'youtubePlayback' }), /advertisement/);
  dom.window.close();
});
