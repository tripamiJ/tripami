export const getDateToDisplay = (date: string | number | Date) => {
  const newDate = new Date(date)
    .toLocaleDateString('en-US', {
      month: '2-digit',
      year: 'numeric',
      day: '2-digit',
    })
    .split('/');
  return `${newDate[1]}/${newDate[0]}/${newDate[2]}`;
};
