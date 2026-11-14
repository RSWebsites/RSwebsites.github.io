/* Credits & licences, shown in Settings → Credits & licences.

   To credit a track, fill in the empty '' fields for that stop:
     title   – the track or recording name
     by      – the musician or recordist
     source  – where it came from (for example Freesound, Pixabay, YouTube Audio Library)
     licence – for example CC BY 4.0, CC0, Pixabay Content Licence
     link    – the web page for the track (optional)
   Anything left empty is not shown. If a stop has nothing filled in yet, the page says
   "Track details to be added".

   What is in each recording was checked by listening for music and background sound:
   stops 3 and 8 have music; stops 2, 4, 5, 6 and 7 have background sound under the voice;
   stop 1 is voice only. */
window.CREDITS = {
  stops: [
    { stop: 1, none: 'Voice only. No music or sound effects.' },
    { stop: 2, items: [{ what: 'Background sound under the narration', title: '', by: '', source: '', licence: '', link: '' }] },
    { stop: 3, items: [{ what: 'Music, between the directions and under the narration', title: '', by: '', source: '', licence: '', link: '' }] },
    // The recording file carries the label "8.8.17" by InspectorJ (a recordist who shares sounds on Freesound).
    { stop: 4, items: [{ what: 'Background sound under the narration', title: '8.8.17', by: 'InspectorJ', source: '', licence: '', link: '' }] },
    // The recording file carries the label "Church", with no name or licence.
    { stop: 5, items: [{ what: 'Background sound, including at the end', title: '', by: '', source: '', licence: '', link: '' }] },
    { stop: 6, items: [{ what: 'Background sound under the narration', title: '', by: '', source: '', licence: '', link: '' }] },
    { stop: 7, items: [{ what: 'Background sound under the narration', title: '', by: '', source: '', licence: '', link: '' }] },
    { stop: 8, items: [{ what: 'Music, at the start and under the narration', title: '', by: '', source: '', licence: '', link: '' }] }
  ],
  chime: 'The soft chime at the end of each stop was made for this tour.',
  fonts: [
    { name: 'Poppins', by: '© 2020 The Poppins Project Authors', licence: 'SIL Open Font License 1.1' },
    { name: 'Young Serif', by: '© 2023 The Young Serif Project Authors', licence: 'SIL Open Font License 1.1' }
  ]
};
