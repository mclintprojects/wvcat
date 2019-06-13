# WVCAT

WVCAT is a modest attempt at speech-based assistive capabilities for the Web. It started as a JavaScript library that developers could integrate into their web page and with little additional coding have speech-based assistive capabilities up and running.

The flaw with WVCAT originally being a JavaScript library was that its usefulness was more towards developers than the end-users I envisioned (users with visual impairements, mobility issues, poor hand-eye coordination, or repetitive strain injuries). My thinking then was that if the library gained wide-enough adoption owing to its ease-of-setup, the benefits would trickle down. Sure, that might have been possible but it would have taken a long time.

That line of thinking then got me wondering how exactly I could make the idea **immediately useful** to end-users. I thought of making a speech-controlled shopping app, email app, and flight booking app before the idea of making a browser extension popped into my head.

Rather than wait on developers to start adopting the library and eventually have the benefits trickle down to the end-users, I can now inject it into any web page with a browser extension. Instant wide-adoption, immediate utility to end-users.

## How does it work?

After WVCAT is installed into a browser, on any page a user navigates to, WVCAT queries for _controllable elements_ using the HTML DOM API. To WVCAT, controllable elements are HTML elements that can obtain focus. These include _buttons, links, radio buttons, checkboxes, file pickers, dropdowns, text inputs, and contenteditable or focusable divs and list items_.

WVCAT then attempts to assign meaningful names to those controllable elements. It does this by checking for the content of the element's **aria-label** attribute, **title** attribute, **name** attribute or **innerText**. If all these sources to yield a name, it generates and assigns a random name to the element. WVCAT also goes on to attach a suffix to the names of element so that the language of issued speech commands are more natural. Example, for an HTML select element with its aria-label attribute set to "age", WVCAT will assign "age dropdown" to that element so issued speech commands can go like "Select age dropdown".

Below is a table containing the suffixes of the various controllable elements.

| HTML Element        | Suffix       |
| ------------------- | ------------ |
| select              | dropdown     |
| a                   | link         |
| button              | button       |
| contenteditable div | button       |
| div tabindex        | button       |
| input[submit]       | button       |
| input[reset]        | button       |
| input[file]         | file picker  |
| input[checkbox]     | checkbox     |
| input[radio]        | radio button |
| input               | input        |
| textarea            | input        |

At this point, WVCAT then initializes the speech recognition engine but only if your browser has full support for the speechRecognition API. Currently supported browsers are Chrome, Opera, and _soon_ Microsoft Edge. WVCAT attaches a white "response container" to the bottom of every web page and this is where it outputs the results of your speech commands or any other signifiers. If this never shows up, your browser does not work with WVCAT.

**NB: The contents of the WVCAT response container can and will be read out by any screenreader you have installed.**

After initialization, WVCAT then waits for you to press the push-to-talk key which is currently the **Ctrl key**. Left or right both work (opt for right though). If the push-to-talk key is pressed, you should hear or see "Listening for your command...". Speak your command and WVCAT should handle the rest.

## Issuing speech commands

To issue speech commands, you need to know both the available commands and also the names of the elements those commands will target.

To know the available commands, focus on a controllable element and say "Show reference". Remember to always press the push-to-talk key before issuing a speech command.

To know the names WVCAT has assigned to the controllable elements on a web page, you can navigate normally using the Tab key. Each time a controllable element gains focus, WVCAT reads and displays the name it assigned to it.

Armed with that information, you can now get started with issuing speech commands. Below is an exhaustive list of the possible commands provided out-of-the-box.

| Command  | Description                                                                                         |
| -------- | --------------------------------------------------------------------------------------------------- |
| Next     | Moves focus to the next controllable element in a webpage. (Equivalent to pressing the Tab key)     |
| Previous | Moves focus to the previous controllable element in a webpage. (Equivalent to pressing Shift + Tab) |
| Select X | Finds and places focus on a controllable element named X                                            |
| Click X  | Finds and clicks on a controllable element named X                                                  |
| Click    | Clicks on an already focused on controllable element                                                |
| Open     | Opens an already focused on controllable element                                                    |
| Clear    | Clears any text entry in an already focused on controllable input element                           |
