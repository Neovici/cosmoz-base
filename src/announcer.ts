import { useEffect, useState } from '@pionjs/pion';

/**
 * Debounces a message for a polite live region that the component renders
 * itself, e.g. `<span aria-live="polite">${announcement}</span>`. Keeping the
 * region inside the component keeps it announced inside modal dialogs, where
 * the rest of the page is inert. An empty message clears the region at once.
 */
export const useAnnouncer = (message: string, delay = 500) => {
	const [announcement, setAnnouncement] = useState('');

	useEffect(() => {
		if (!message) return setAnnouncement('');
		const id = setTimeout(() => setAnnouncement(message), delay);
		return () => clearTimeout(id);
	}, [message, delay]);

	return announcement;
};
