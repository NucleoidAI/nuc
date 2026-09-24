# Policy Phone Update — Narrator Notes

A customer emails to change the phone number on their policy. The GreyCollar agent reads the email, finds the policy record on IBM i (AS/400), gets **approval from the policyholder through a link in an email**, writes the new number back to the AS/400 and emails the customer a confirmation.

**The only difference from the address demo is the approval channel.** Same blueprint, same agent. This time the agent follows a rule in its knowledge base and chooses email instead of WhatsApp. That difference is good evidence for the message "the rules live in knowledge, not in code".

---

## 1 · Customer emails a phone number change

**Screen:** Gmail, full screen.

**Presenter action:** Send the prepared email from Gmail.

> **Subject:** Policy phone number change
>
> Hello, I would like to update the contact phone number on policy `<POLICY NO>` to `<NEW NUMBER>`.
>
> Thank you.

> The policy number must exist in the IBM i demo data, otherwise the agent cannot find the record and the flow stops at step 3.

**Behind the scenes:** GreyCollar's email channel watches the inbox. When the email arrives it opens a session and routes the email to the **Policy Contact Detail Update** blueprint.

**Narrator:**
- "This time our customer wants to change their phone number. Again, just an ordinary email."
- "The same workflow as the address change will run. But at one point it will behave differently, and I'll point that out."

**Moves on:** Automatically when the email reaches GreyCollar (`EMAIL_RECEIVED`).

---

## 2 · Task lands in GreyCollar

**Screen:** Gmail on the left, BGTS AI Platform on the right (the page of the agent running the task).

**Behind the scenes:** The agent read the email, recognised a contact detail change and opened a task with the same blueprint:
**read the policy → get 2FA approval → decide phone or address → update → notify the customer → complete**.

**Narrator:**
- "Same blueprint, same steps. The organisation defines this job with a single recipe, whether it's a phone number or an address."
- "We can follow live which step the agent is on and what it is doing."

**Moves on:** Automatically when the first step of the task is added (`STEP_ADDED`).

---

## 3 · Policy read from IBM i

**Screen:** IBM i (AS/400) on the left, BGTS on the right.

**Behind the scenes:** Using `AS400:get_policy`, the agent reads the **POLMAST** record for the policy number in the email: holder, status, cover details and the contact details on file. The approval request will go to the trusted contact details on this record.

**Narrator:**
- "First the current record is read: does the policy exist, and what details are on file right now."
- "The AS/400 is untouched. The agent works on top of the system an employee would use."

**Moves on:** Automatically when the agent publishes the 2FA step (`STEP_ADDED`, `PLATFORM:two_factor`). IBM stays on screen until then.

---

## 4 · Email approval

**Screen:** Outlook (greycollar.ai profile) on the left, BGTS on the right.

**Presenter action:** Open the **"Approval required"** email in Outlook and click **Approve**.

**Behind the scenes:** Before the change, the agent asks the policyholder for approval. It picked the channel from a rule in its knowledge base: *phone number change → email*. The email contains single-use **Approve** and **Reject** links that are valid for **10 minutes**. The task waits until a link is clicked.

**Narrator:**
- "Here's the difference. For the address change the approval came over WhatsApp. This time the agent sent an email."
- "The agent doesn't choose this on a whim. There's a rule in the knowledge base: phone changes are verified by email, everything else by WhatsApp. The logic is simple: when the phone number is what's changing, we don't want to send the verification to that phone."
- "If the rule changes, updating the knowledge base is enough. No code, no rebuilt workflow."
- *(After clicking Approve)* "The policyholder approved. The link is single-use and time-limited, so it's secure. The agent picks up where it left off."

**Moves on:** Automatically when the 2FA step completes as `APPROVED`.

> The link expires after 10 minutes. Don't linger on this step if the talk runs long.
> If **Reject** is clicked, the task fails and the demo does not move on.

---

## 5 · Phone number updated in IBM i

**Screen:** IBM i (AS/400) on the left, BGTS on the right.

**Behind the scenes:** At the "Phone or address change?" decision the agent took the **phone** branch. Using `AS400:update_policy_phone` it updated only the telephone and/or mobile field on the POLMAST record and left the rest of the record untouched. It then sent the customer a confirmation.

**Narrator:**
- "This time the agent took the phone branch. Same decision point, different outcome."
- "The new number was written straight to the AS/400. Only the requested field changed."
- *(Showing the record on the IBM screen)* "The record is up to date."

**Moves on:** Automatically when the task completes (`TASK_COMPLETED`).

---

## 6 · Customer gets the confirmation

**Screen:** BGTS on the left, Gmail on the right.

**Presenter action:** Open the confirmation email from the agent in Gmail.

**Behind the scenes:** The agent replied in the same email thread with the policy number, the field that changed and its new value. The task is complete.

**Narrator:**
- "The customer sees in their own email thread that the job is done."
- "Put the two demos side by side: same blueprint, same agent. Depending on the type of change, a different decision branch and a different approval channel ran — all under rules the organisation defined, and with human approval."

---

## If something gets stuck

- **Step 2 never starts:** Check that the email went to the address GreyCollar watches, and that this mailbox is linked to the Policy Contact Detail Update blueprint.
- **Step 3 never finishes:** Check that the policy number in the email exists in the IBM i demo data.
- **No approval email:** Check the junk folder in Outlook.
- **The link says it has expired:** More than 10 minutes have passed. Send the customer email from Gmail again; only a new task produces a new approval email.
