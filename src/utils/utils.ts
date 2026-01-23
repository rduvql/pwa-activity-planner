/**
 * https://support.google.com/calendar/thread/81344786/how-do-i-generate-add-to-calendar-link-from-our-own-website?hl=en
 * https://dylanbeattie.net/2021/01/12/adding-events-to-google-calendar-via-a-link.html
 */
export const googleCalendarLink = ({ fromstr, tostr, title }: { fromstr: string, tostr: string; title: string; }) => {

    const parseDateTimeToRFC5545 = (date: Date): string => {
        const y = date.getFullYear().toString().padStart(4, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');

        const h = date.getHours().toString().padStart(2, '0');
        const M = date.getMinutes().toString().padStart(2, '0');
        const s = date.getSeconds().toString().padStart(2, '0');

        return `${y}${m}${d}T${h}${M}${s}`;
    };

    let from = new Date(fromstr);
    let to = new Date(tostr);

    let qp = [
        ["action", "TEMPLATE"],
        ["text", title],
        ["dates",
            `${parseDateTimeToRFC5545(from)}/${parseDateTimeToRFC5545(to)}`],
        ["details", "blabla"],
        // ["recur", "RRULE:FREQ=WEEKLY;UNTIL=20210603"],
        ["ctz=Europe/Paris"]
    ];
    let url = new URL("https://calendar.google.com/calendar/render");
    qp.forEach(_qp => {
        url.searchParams.append(_qp[0], _qp[1]);
    });
    return url.toString();
};

export const createDownloadLink = (data: string, filename: string, mimeType: string) => {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const safeParseUrl = (urlStr: string): URL | null => {
    try {
        return new URL(urlStr);
    } catch (e) {
        return null
    }
};
