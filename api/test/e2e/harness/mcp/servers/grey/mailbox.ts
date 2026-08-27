type SentEmail = {
  from: string;
  to: string[];
  data: string;
};

const sentEmails: SentEmail[] = [];

function deliver(email: SentEmail) {
  sentEmails.push(email);
}

function emailsMatching(needle: string) {
  const lowered = needle.toLowerCase();

  return sentEmails.filter(
    (email) =>
      email.to.some((to) => to.toLowerCase().includes(lowered)) ||
      email.data.toLowerCase().includes(lowered)
  );
}

function resetEmails() {
  sentEmails.length = 0;
}

export { sentEmails, deliver, emailsMatching, resetEmails };
export type { SentEmail };
