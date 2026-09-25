# Policy Address Update — Narrator Notes

A customer emails to change the address on their policy. The GreyCollar agent reads the email, finds the policy record on IBM i (AS/400), gets **approval from the policyholder over WhatsApp**, writes the new address back to the AS/400 and emails the customer a confirmation. Nobody copies data between screens and nobody types into any system by hand.

**Key message:** The legacy core system stays where it is. GreyCollar does the work an employee would do on top of those systems, following the rules and with a human approving the change.

---

## 1 · Customer emails an address change

**Screen:** Gmail, full screen.

**Presenter action:** Send the prepared email from Gmail.

> **Subject:** Policy address change
>
> Hello, I would like to update the address on policy `<POLICY NO>` to:
> `<Address line 1>`, `<Address line 2>`, `<City>`, `<County>`, `<Postcode>`
>
> Thank you.

> The policy number must exist in the IBM i demo data, otherwise the agent cannot find the record and the flow stops at step 3.

**Behind the scenes:** GreyCollar's email channel watches the inbox. When the email arrives it opens a session and routes the email to the **Policy Contact Detail Update** blueprint linked to that mailbox.

**Narrator:**
- "Our customer sends an ordinary email. There is no special form, portal or app."
- "Normally this email would land in a contact centre or operations queue. Someone would open it, look up the policy on the AS/400, verify the customer and change the address by hand."
- "Now we'll watch GreyCollar's digital worker do the same job."

**Moves on:** Automatically when the email reaches GreyCollar (`EMAIL_RECEIVED`).

---

## 2 · Task lands in GreyCollar

**Screen:** Gmail on the left, GreyCollar on the right (the page of the agent running the task).

**Behind the scenes:** The agent read the email and understood that it is a contact detail change. Following the blueprint it opened a task with this plan:
**read the policy → get 2FA approval → decide phone or address → update → notify the customer → complete**.

**Narrator:**
- "The agent understood the email and picked the right workflow. What you see here is a blueprint: the organisation's recipe for how this job is done."
- "The agent doesn't improvise. The steps, their order and the rules are defined. For example, nothing is written to a record before approval."
- "Every step shows up here live. You can trace who did what and which system was read."

**Moves on:** Automatically when the first step of the task is added (`STEP_ADDED`).

---

## 3 · Policy read from IBM i

**Screen:** IBM i (AS/400) on the left, GreyCollar on the right.

**Behind the scenes:** Using the `AS400:get_policy` tool, the agent reads the **POLMAST** record for the policy number in the email: holder, policy type, status, cover dates, premium, sum insured, and the address and contact details on file. This confirms the policy exists and captures its current details.

**Narrator:**
- "This is the IBM i (AS/400) the organisation uses today. We didn't change it and we didn't build a new database."
- "The agent pulled the policy record. Before changing anything it reads the current state first, just as an employee would."
- "The legacy systems stay in place. GreyCollar doesn't replace them, it works on top of them."

**Moves on:** Automatically when the agent publishes the 2FA step (`STEP_ADDED`, `PLATFORM:two_factor`). IBM stays on screen until then.

---

## 4 · WhatsApp 2FA approval

**Screen:** WhatsApp Business on the left, GreyCollar on the right.

**Presenter action:** **Approve** the request that arrives in WhatsApp.

**Behind the scenes:** Before changing the policy, the agent asks the policyholder for approval. The agent doesn't pick the channel itself; it follows a rule in its knowledge base: *address change → WhatsApp*. The request goes to the trusted contact details on the policy. The task waits until the approval comes in.

**Narrator:**
- "A critical record is about to change, so the agent doesn't write on its own. It asks the policyholder first."
- "A rule decides the approval channel, and that rule lives in the agent's knowledge base. For an address change it's WhatsApp. Changing the rule doesn't require any code."
- "This is human–AI collaboration: the agent does the routine work, and a person steps in at the moment of decision."
- *(After approving)* "Approval is in. The agent picks up where it left off."

**Moves on:** Automatically when the 2FA step completes as `APPROVED`.

> If the request is rejected, the task fails and the demo does not move on. That is a point worth making too: nothing is written without approval.

---

## 5 · Address updated in IBM i

**Screen:** IBM i (AS/400) on the left, GreyCollar on the right.

**Behind the scenes:** At the blueprint's "Phone or address change?" decision the agent took the **address** branch. Using `AS400:update_policy_address` it updated only the address lines, city, county and postcode on the POLMAST record and left the rest of the record untouched. It then sent the customer a confirmation.

**Narrator:**
- "The agent recognised this as an address change and took the right branch."
- "The new address was written straight to the AS/400. Only the requested fields changed; the rest of the policy is exactly as it was."
- *(Showing the record on the IBM screen)* "The record is up to date."

**Moves on:** Automatically when the task completes (`TASK_COMPLETED`).

---

## 6 · Customer gets the confirmation

**Screen:** GreyCollar on the left, Gmail on the right.

**Presenter action:** Open the confirmation email from the agent in Gmail.

**Behind the scenes:** The agent replied in the same email thread with the policy number, the field that changed and its new value. The task is complete.

**Narrator:**
- "The customer sees, in the thread they started, that the job is done: which policy, what changed and the new value."
- "End to end: the email came in, the policy was read from the AS/400, the policyholder approved on WhatsApp, the record was updated and the customer was notified. Work that takes an employee several minutes was done in a traceable way that follows the rules."

---

## If something gets stuck

- **Step 2 never starts:** Check that the email went to the address GreyCollar watches, and that this mailbox is linked to the Policy Contact Detail Update blueprint.
- **Step 3 never finishes:** Check that the policy number in the email exists in the IBM i demo data.
