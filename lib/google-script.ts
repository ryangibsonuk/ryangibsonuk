export const GOOGLE_ACTIVITY_SCRIPT = `function doGet(e) {
  var expected = PropertiesService.getScriptProperties().getProperty("HQ_TOKEN");
  var got = e && e.parameter ? e.parameter.token : "";
  if (expected && got !== expected) {
    return json_({ error: "unauthorized" });
  }
  return json_(collect_());
}

function collect_() {
  var items = [];
  var threads = GmailApp.getInboxThreads(0, 20);
  for (var i = 0; i < threads.length; i++) {
    var thread = threads[i];
    var messages = thread.getMessages();
    var last = messages[messages.length - 1];
    items.push({
      source: "gmail",
      title: thread.getFirstMessageSubject() || "(no subject)",
      detail: last ? last.getFrom() : "",
      url: "https://mail.google.com/mail/u/0/#all/" + thread.getId(),
      ts: thread.getLastMessageDate().toISOString(),
    });
  }

  var start = new Date();
  start.setDate(start.getDate() - 2);
  var end = new Date();
  end.setDate(end.getDate() + 14);
  var events = CalendarApp.getDefaultCalendar().getEvents(start, end);
  for (var j = 0; j < events.length; j++) {
    var event = events[j];
    items.push({
      source: "calendar",
      title: event.getTitle() || "Calendar event",
      detail: event.getLocation() || "",
      url: "https://calendar.google.com/calendar/u/0/r",
      ts: event.getStartTime().toISOString(),
    });
  }

  var cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  var stamp = cutoff.toISOString().slice(0, 10);
  var files = DriveApp.searchFiles("modifiedDate > '" + stamp + "'");
  var n = 0;
  while (files.hasNext() && n < 20) {
    var file = files.next();
    items.push({
      source: "drive",
      title: file.getName(),
      detail: "Updated in Drive",
      url: file.getUrl(),
      ts: file.getLastUpdated().toISOString(),
    });
    n++;
  }

  items.sort(function (a, b) {
    return a.ts < b.ts ? 1 : -1;
  });
  return { ok: true, items: items.slice(0, 50) };
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
`;
