const MONTHS = [
  { year: 2026, month: 2, label: 'Март 2026' },
  { year: 2026, month: 3, label: 'Апрель 2026' },
  { year: 2026, month: 4, label: 'Май 2026' }
];

const WEEKDAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const STORAGE_KEY = 'severny-chelovek-events';

let currentMonthIndex = 0;
let events = loadEvents();
let selectedDate = null;
let selectedEvent = null;

const monthTitleEl = document.getElementById('monthTitle');
const monthsSwitcherEl = document.getElementById('monthsSwitcher');
const weekdaysRowEl = document.getElementById('weekdaysRow');
const calendarGridEl = document.getElementById('calendarGrid');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');

const eventModalOverlay = document.getElementById('eventModalOverlay');
const closeEventModalBtn = document.getElementById('closeEventModal');
const eventModalImage = document.getElementById('eventModalImage');
const eventModalDate = document.getElementById('eventModalDate');
const eventModalTitle = document.getElementById('eventModalTitle');
const eventModalDescription = document.getElementById('eventModalDescription');
const eventModalAction = document.getElementById('eventModalAction');
const editEventBtn = document.getElementById('editEventBtn');

const adminModalOverlay = document.getElementById('adminModalOverlay');
const closeAdminModalBtn = document.getElementById('closeAdminModal');
const adminModalDate = document.getElementById('adminModalDate');
const adminModalTitle = document.getElementById('adminModalTitle');
const deleteEventBtn = document.getElementById('deleteEventBtn');
const form = document.getElementById('eventForm');
const formDate = document.getElementById('formDate');
const formTitle = document.getElementById('formTitle');
const formDescription = document.getElementById('formDescription');
const formImage = document.getElementById('formImage');
const formStatus = document.getElementById('formStatus');
const formButtonLabel = document.getElementById('formButtonLabel');
const formButtonUrl = document.getElementById('formButtonUrl');

function loadEvents() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Не удалось загрузить события из localStorage:', error);
  }
  return [...window.DEFAULT_EVENTS];
}

function saveEvents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function getEventByDate(dateString) {
  return events.find((event) => event.date === dateString) || null;
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function buildWeekdays() {
  weekdaysRowEl.innerHTML = '';
  WEEKDAYS.forEach((weekday) => {
    const el = document.createElement('div');
    el.className = 'weekday-cell';
    el.textContent = weekday;
    weekdaysRowEl.appendChild(el);
  });
}

function buildMonthsSwitcher() {
  monthsSwitcherEl.innerHTML = '';
  MONTHS.forEach((monthData, index) => {
    const btn = document.createElement('button');
    btn.className = `month-pill ${index === currentMonthIndex ? 'active' : ''}`;
    btn.textContent = monthData.label;
    btn.addEventListener('click', () => {
      currentMonthIndex = index;
      renderCalendar();
    });
    monthsSwitcherEl.appendChild(btn);
  });
}

function renderCalendar() {
  const current = MONTHS[currentMonthIndex];
  monthTitleEl.textContent = current.label;
  prevMonthBtn.disabled = currentMonthIndex === 0;
  nextMonthBtn.disabled = currentMonthIndex === MONTHS.length - 1;
  buildMonthsSwitcher();

  const firstDay = new Date(current.year, current.month, 1);
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  const leadingEmpty = (firstDay.getDay() + 6) % 7;

  calendarGridEl.innerHTML = '';

  for (let i = 0; i < leadingEmpty; i += 1) {
    const prevDate = new Date(current.year, current.month, i - leadingEmpty + 1);
    calendarGridEl.appendChild(createDayCell(prevDate, true));
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(current.year, current.month, day);
    calendarGridEl.appendChild(createDayCell(date, false));
  }

  const totalCells = leadingEmpty + daysInMonth;
  const trailingEmpty = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

  for (let i = 1; i <= trailingEmpty; i += 1) {
    const nextDate = new Date(current.year, current.month + 1, i);
    calendarGridEl.appendChild(createDayCell(nextDate, true));
  }
}

function createDayCell(date, isOtherMonth) {
  const dateString = toDateString(date);
  const existingEvent = getEventByDate(dateString);
  const cell = document.createElement('button');
  cell.type = 'button';
  cell.className = `day-cell clickable ${isOtherMonth ? 'other-month' : 'current-month'}`;

  const dayNumber = document.createElement('span');
  dayNumber.className = 'day-number';
  dayNumber.textContent = String(date.getDate());
  cell.appendChild(dayNumber);

  if (existingEvent) {
    cell.classList.add('has-event');
    if (existingEvent.status === 'past') {
      cell.classList.add('past-event');
    }
    cell.title = existingEvent.title;

    const eventCard = document.createElement('div');
    eventCard.className = `event-card ${existingEvent.status === 'past' ? 'past' : ''}`;

    const title = document.createElement('strong');
    title.textContent = existingEvent.title;

    const status = document.createElement('span');
    status.textContent = existingEvent.status === 'past' ? 'Прошло' : 'Скоро';

    eventCard.appendChild(title);
    eventCard.appendChild(status);
    cell.appendChild(eventCard);

    cell.addEventListener('click', () => openEventModal(existingEvent));
  } else {
    const hint = document.createElement('div');
    hint.className = 'empty-hint';
    hint.textContent = isOtherMonth ? '' : '+ добавить';
    cell.appendChild(hint);

    cell.addEventListener('click', () => {
      if (!isOtherMonth) {
        openAdminModal({ date: dateString });
      }
    });
  }

  return cell;
}

function openEventModal(eventData) {
  selectedEvent = eventData;
  eventModalImage.src = eventData.image || 'assets/placeholder-event.png';
  eventModalImage.onerror = () => {
    eventModalImage.src = 'assets/placeholder-event.png';
  };
  eventModalDate.textContent = formatDate(eventData.date);
  eventModalTitle.textContent = eventData.title;
  eventModalDescription.textContent = eventData.description || 'Описание не заполнено.';

  const buttonText = eventData.buttonLabel?.trim()
    ? eventData.buttonLabel.trim()
    : eventData.status === 'past'
      ? 'Отчет о мероприятии'
      : 'Участвовать';

  eventModalAction.textContent = buttonText;
  eventModalAction.href = eventData.buttonUrl?.trim() ? eventData.buttonUrl.trim() : '#';

  if (!eventData.buttonUrl || eventData.buttonUrl === '#') {
    eventModalAction.addEventListener('click', preventFakeLink, { once: true });
  }

  eventModalOverlay.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function preventFakeLink(event) {
  event.preventDefault();
}

function closeEventModal() {
  selectedEvent = null;
  eventModalOverlay.classList.add('hidden');
  tryCloseBodyLock();
}

function openAdminModal(eventData = null) {
  const isEditing = Boolean(eventData && getEventByDate(eventData.date));
  const existingEvent = isEditing ? getEventByDate(eventData.date) : eventData;
  selectedDate = existingEvent?.date || eventData?.date || toDateString(new Date());

  formDate.value = selectedDate;
  formTitle.value = existingEvent?.title || '';
  formDescription.value = existingEvent?.description || '';
  formImage.value = existingEvent?.image || 'assets/placeholder-event.png';
  formStatus.value = existingEvent?.status || 'upcoming';
  formButtonLabel.value = existingEvent?.buttonLabel || '';
  formButtonUrl.value = existingEvent?.buttonUrl || '#';

  adminModalDate.textContent = formatDate(selectedDate);
  adminModalTitle.textContent = isEditing ? 'Редактировать мероприятие' : 'Добавить мероприятие';
  deleteEventBtn.style.display = isEditing ? 'inline-flex' : 'none';

  adminModalOverlay.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function closeAdminModal() {
  selectedDate = null;
  adminModalOverlay.classList.add('hidden');
  tryCloseBodyLock();
}

function tryCloseBodyLock() {
  if (eventModalOverlay.classList.contains('hidden') && adminModalOverlay.classList.contains('hidden')) {
    document.body.classList.remove('modal-open');
  }
}

function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function handleFormSubmit(event) {
  event.preventDefault();

  const eventData = {
    date: formDate.value,
    title: formTitle.value.trim(),
    description: formDescription.value.trim(),
    image: formImage.value.trim() || 'assets/placeholder-event.png',
    status: formStatus.value,
    buttonLabel: formButtonLabel.value.trim(),
    buttonUrl: formButtonUrl.value.trim() || '#'
  };

  events = events.filter((item) => item.date !== selectedDate);
  events.push(eventData);
  events.sort((a, b) => a.date.localeCompare(b.date));
  saveEvents();
  closeAdminModal();
  renderCalendar();
}

function handleDeleteEvent() {
  if (!selectedDate) return;
  events = events.filter((item) => item.date !== selectedDate);
  saveEvents();
  closeAdminModal();
  renderCalendar();
}

prevMonthBtn.addEventListener('click', () => {
  if (currentMonthIndex > 0) {
    currentMonthIndex -= 1;
    renderCalendar();
  }
});

nextMonthBtn.addEventListener('click', () => {
  if (currentMonthIndex < MONTHS.length - 1) {
    currentMonthIndex += 1;
    renderCalendar();
  }
});

closeEventModalBtn.addEventListener('click', closeEventModal);
closeAdminModalBtn.addEventListener('click', closeAdminModal);
editEventBtn.addEventListener('click', () => {
  if (!selectedEvent) return;
  closeEventModal();
  openAdminModal(selectedEvent);
});

form.addEventListener('submit', handleFormSubmit);
deleteEventBtn.addEventListener('click', handleDeleteEvent);

eventModalOverlay.addEventListener('click', (event) => {
  if (event.target === eventModalOverlay) {
    closeEventModal();
  }
});

adminModalOverlay.addEventListener('click', (event) => {
  if (event.target === adminModalOverlay) {
    closeAdminModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeEventModal();
    closeAdminModal();
  }
});

buildWeekdays();
renderCalendar();
