# Correction form walkthrough

This document walks through what the correction form looks like.

This is an example of a link to a journal called "Dream of working abroad" opened in correction mode: https://langcorrect.com/journals/dream-of-working-abroad/make_corrections

The full text looks like this:
```text
Dream of working abroad
I have been working for more than ten years. I feel there is nothing interesting to me recently. Every day, work is repetitive routine and I feel it is very dull. What's worse, during this involution period it is very hard for older people to get alternative jobs.

I have no idea how to get a software develop job and not sure where it can solve my current problems.
```

On the webpage, each sentence gets split up into correction cards, like:
```html
<div class="card js-correction-card" data-sentence-id="1219073" data-original-sentence="Dream of working abroad" data-action="none">
   <div class="card-body border-bottom">
      <span lang="en" class="js-sentence">
      <span class="badge text-bg-light pointer" data-bs-toggle="tooltip" data-bs-placement="bottom" data-bs-title="Ensure post titles are correctly formatted">Post title</span>
      Dream of working abroad
      </span>
   </div>
   <div class="card-body d-none " data-correction-box="1219073">
      <div class="mb-3">
         <label for="js-correction-row-1219073" class="form-label">
         Make your correction here.
         </label>
         <textarea lang="en" class="form-control" name="correction-row-1219073" id="js-correction-row-1219073" placeholder="Write the correct sentence here..." style="overflow-x: hidden; overflow-wrap: break-word;">Dream of working abroad</textarea>
      </div>
      <div class="mb-3">
         <label for="js-correction-note-1219073" class="form-label">
         Include feedback for this correction here.
         </label>
         <textarea lang="en" class="form-control" name="correction-note-1219073" id="js-correction-note-1219073" placeholder="Write your feedback here..." style="overflow-x: hidden; overflow-wrap: break-word;"></textarea>
      </div>
   </div>
   <div class="d-flex justify-content-end p-2 gap-2 border-top">
      <button class="btn btn-sm btn-primary js-mark-as-perfect" data-sentence-id="1219073">
      <i class="fa-solid fa-circle-check"></i>
      </button>
      <button class="btn btn-sm btn-outline-primary js-edit-btn" data-sentence-id="1219073" data-correction-btn="1219073">
      <i class="fa-solid fa-pen"></i>
      </button>
   </div>
</div>
```

As you can see, each correction card has a button that lets you mark it as perfect, and a button that lets you edit it.

The sentence should be written correctly in the `correction-row-id` named field, and the feedback should be written in the `correction-note-id` named field.

As a corrector, you may make a correction like:
```
original:I have been working for more than ten years.
perfect:true
revised:
note:

original:I feel there is nothing interesting to me recently.
perfect:false
revised:I feel like nothing has been interesting to me lately.
note:“feel like” + “lately” sound more natural.

original:Every day, work is repetitive routine and I feel it is very dull.
perfect:false
revised:Every day feels like the same repetitive routine, and it has become really dull.
note:More natural flow and phrasing.

original:What's worse, during this involution period it is very hard for older people to get alternative jobs.
perfect:false
revised:What’s worse, during this period of intense competition, it’s very hard for older workers to find other jobs.
note:Replaced uncommon “involution” with everyday phrasing; “older workers” sounds more natural.

original:I have no idea how to get a software develop job and not sure where it can solve my current problems.
perfect:false
revised:I have no idea how to get a software development job, and I’m not sure whether it would even solve my current problems.
note:Corrected grammar and clarified the second clause.

feedback:Your meaning is always clear, and you express your feelings directly. Most fixes are small phrasing and grammar tweaks to make your English sound more natural. You're already doing well — keep writing.
```


The trouble is now filling in the form, so that all the user has to do is hit the submit button:
```html
<button type="submit" class="btn btn-primary">Submit</button>
```



