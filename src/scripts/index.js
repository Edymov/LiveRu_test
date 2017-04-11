'use strict';

(function () {

	const brainsSector = [...document.querySelectorAll('.brains__sector')],
		brainsSectors = document.querySelector('.brains__sectors'),
		messages = [...document.querySelectorAll('.brains__message')],
		lines = [...document.querySelectorAll('.brains__line')];

	/**
	 * Получаем массив текущих секторов
	 * @param x{number}
	 * @param y{number}
	 * @return {array}
	 */

	function getCurrentSectors(x, y) {
		let item = document.elementFromPoint(x, y),
			items = [];
		while (item.tagName.toUpperCase() === 'PATH') {
			items.push(item);
			item.style.visibility = 'hidden';
			item = document.elementFromPoint(x, y);
		}
		items.forEach(item => item.style.visibility = '');
		return items;
	}

	function hideMessages() {
		messages.forEach(item => item.classList.remove('brains__message--active'));
	}

	function hideLines() {
		lines.forEach(item => item.classList.remove('brains__line--active'));
	}

	/**
	 * Обработка движений мыши
	 * @param e{event}
	 */

	function processMouse(e) {
		let x = e.clientX,
			y = e.clientY,
			elems = getCurrentSectors(x, y);
		hideLines();
		hideMessages();
		brainsSector.forEach(sector => sector.classList.remove('brains__sector--active'));
		elems
			.filter(item => item.classList.contains('brains__sector'))
			.forEach((item) => {
				let sectionNum = item.getAttribute('data-sector'),
					msgShow = messages.filter(msg => msg.getAttribute('data-sector') === sectionNum),
					lineShow = lines.filter(line => line.getAttribute('data-sector') === sectionNum);
				item.classList.add('brains__sector--active');
				msgShow[0].classList.add('brains__message--active');
				lineShow[0].classList.add('brains__line--active');
			});
	}

	brainsSectors.addEventListener('mousemove', processMouse);

})();
