function getStartOfDay(date) {
const result = new Date(date);
result.setHours(0, 0, 0, 0);
return result;
}

export function updateStudyStreak(user, currentDate = new Date()) {
const today = getStartOfDay(currentDate);

if (!user.lastActiveDate) {
user.studyStreak = 1;
} else {
const lastActiveDay = getStartOfDay(user.lastActiveDate);
const differenceInDays = Math.round(
(today.getTime() - lastActiveDay.getTime()) / (1000 * 60 * 60 * 24)
);


if (differenceInDays === 1) {
  user.studyStreak += 1;
} else if (differenceInDays > 1) {
  user.studyStreak = 1;
}
// If differenceInDays is 0, the user has already studied today.
// Keep the existing streak unchanged.


}

user.lastActiveDate = currentDate;
}
