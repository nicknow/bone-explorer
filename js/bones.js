/*! Bone Explorer | Copyright (c) 2026 Nicolas Nowinski | MIT License */
/*
 * Bone facts, written for kids about 6-9 years old.
 * Every one of the 206 bones gets an entry. Bones that come in a series
 * (ribs, backbones, finger and toe bones) are generated from templates.
 */
window.SK = window.SK || {};

(function (SK) {
  'use strict';

  SK.REGIONS = [
    { id: 'head', name: 'Head', emoji: '💀', color: '#ff7a59', blurb: 'Your skull is made of 22 bones that fit together like a puzzle. They protect your brain and make the shape of your face. The hyoid bone in your throat is here too.' },
    { id: 'ears', name: 'Ears', emoji: '👂', color: '#c77dff', blurb: 'Deep inside each ear are 3 tiny bones. They are the smallest bones in your whole body, and they help you hear!' },
    { id: 'spine', name: 'Backbone', emoji: '🐍', color: '#4cc9f0', blurb: 'Your backbone (spine) is a stack of 26 bones. It holds you up, lets you bend and twist, and protects the big nerve that carries messages to your brain.' },
    { id: 'chest', name: 'Chest', emoji: '🛡️', color: '#f9c74f', blurb: 'Your ribs and breastbone make a cage that guards your heart and lungs. It moves out and in every time you breathe!' },
    { id: 'shoulders', name: 'Shoulders', emoji: '💪', color: '#90be6d', blurb: 'Your collarbones and shoulder blades connect your arms to the rest of your body.' },
    { id: 'arms', name: 'Arms', emoji: '🦾', color: '#43aa8b', blurb: 'Each arm has 3 long bones: one in your upper arm and two in your forearm.' },
    { id: 'hands', name: 'Hands', emoji: '✋', color: '#f3722c', blurb: 'Each hand has 27 bones! Lots of small bones let your hands grab, wiggle, write and wave.' },
    { id: 'hips', name: 'Hips', emoji: '🦋', color: '#f94144', blurb: 'Your two hip bones make a big bowl called the pelvis. It holds up your belly and connects your legs to your body.' },
    { id: 'legs', name: 'Legs', emoji: '🦵', color: '#577590', blurb: 'Your legs have the biggest, strongest bones in your body. They carry you everywhere!' },
    { id: 'feet', name: 'Feet', emoji: '🦶', color: '#9b5de5', blurb: 'Each foot has 26 bones. They work together to help you stand, walk, run and jump.' }
  ];

  const list = [];
  const SIDES = [['r', 'right'], ['l', 'left']];
  function add(b) { list.push(b); }
  /* pair(): one entry per side */
  function pair(base, info) {
    for (const [s, side] of SIDES) add(Object.assign({}, info, { id: base + '-' + s, type: base, side }));
  }
  function one(id, info) { add(Object.assign({ id, type: id, side: null }, info)); }

  /* ---------------- HEAD ---------------- */
  one('frontal', {
    region: 'head', name: 'Forehead bone', sci: 'Frontal bone', say: 'FRUN-tul', level: 1,
    about: 'This big curved bone makes your forehead. It also forms the tops of your eye sockets, like little roofs for your eyes.',
    fact: 'When you were a baby, this bone was two halves. They joined together into one bone as you grew!',
    tryit: 'Knock gently on your forehead. That hard part is your frontal bone.'
  });
  pair('parietal', {
    region: 'head', name: 'Top of the head bone', sci: 'Parietal bone', say: 'puh-RY-uh-tul', level: 2,
    about: 'These two bones make the top and sides of your skull, like the roof and walls of a house for your brain.',
    fact: '"Parietal" comes from a word that means "wall." Babies have a soft spot on top where these bones have not joined yet.',
    tryit: 'Put your hand flat on the top of your head. You are touching your parietal bones.'
  });
  pair('temporal', {
    region: 'head', name: 'Temple bone', sci: 'Temporal bone', say: 'TEM-pur-ul', level: 2,
    about: 'These bones are on the sides of your head, around your ears. They hold your hearing parts and the hole that sound travels through.',
    fact: 'Your 3 tiny ear bones are hidden inside the temporal bone!',
    tryit: 'Touch the bump just behind your ear. That bump is part of your temporal bone.'
  });
  one('occipital', {
    region: 'head', name: 'Back of the head bone', sci: 'Occipital bone', say: 'ok-SIP-ih-tul', level: 2,
    about: 'This bone makes the back and bottom of your skull. It sits right on top of your backbone.',
    fact: 'It has a big hole in the bottom. Your spinal cord goes through it to connect your brain to the rest of your body.',
    tryit: 'Feel the bump at the back of your head. That is your occipital bone.'
  });
  one('sphenoid', {
    region: 'head', name: 'Butterfly bone', sci: 'Sphenoid bone', say: 'SFEE-noyd', level: 3,
    about: 'This bone sits in the middle of your skull, behind your eyes. It touches lots of other skull bones and helps hold them together.',
    fact: 'It is shaped like a butterfly (or a bat) with its wings spread out!',
    tryit: 'Touch your temple, the soft spot beside your eye. Part of the sphenoid is under there.'
  });
  one('ethmoid', {
    region: 'head', name: 'Sponge bone', sci: 'Ethmoid bone', say: 'ETH-moyd', level: 3,
    about: 'This light, holey bone sits between your eyes, deep behind your nose. It helps make the inside walls of your nose and eye sockets.',
    fact: '"Ethmoid" means "like a sieve." It has tiny holes that let smell messages travel from your nose to your brain.',
    tryit: 'Sniff something nice! The smell signals pass through tiny holes in your ethmoid bone.'
  });
  pair('nasal', {
    region: 'head', name: 'Nose bone', sci: 'Nasal bone', say: 'NAY-zul', level: 2,
    about: 'These two small bones make the bridge of your nose, the hard part between your eyes.',
    fact: 'Only the top of your nose is bone. The wiggly tip is made of bendy cartilage, so it does not show up on a skeleton!',
    tryit: 'Wiggle the tip of your nose, then feel the hard bridge. The hard part is your nasal bones.'
  });
  pair('maxilla', {
    region: 'head', name: 'Upper jaw bone', sci: 'Maxilla', say: 'mak-SIL-uh', level: 2,
    about: 'This bone holds all your top teeth. It also makes your cheeks, the floor of your eye sockets and the front of the roof of your mouth.',
    fact: 'It has a big air pocket inside called a sinus. That makes your head lighter and your voice sound better!',
    tryit: 'Run your tongue along your top teeth. They are all held by your maxilla bones.'
  });
  pair('zygomatic', {
    region: 'head', name: 'Cheekbone', sci: 'Zygomatic bone', say: 'zy-go-MAT-ik', level: 2,
    about: 'These are your cheekbones. They make the bumps on your cheeks and the outside edge of your eye sockets.',
    fact: 'Your cheekbone forms an arch that your chewing muscle passes under, like a bridge!',
    tryit: 'Smile big and touch the hard bumps on your cheeks.'
  });
  pair('lacrimal', {
    region: 'head', name: 'Tear bone', sci: 'Lacrimal bone', say: 'LAK-rih-mul', level: 3,
    about: 'This tiny bone is in the inner corner of each eye socket. It has a little groove where tears drain into your nose.',
    fact: 'It is the smallest bone in your face, about the size of a fingernail. That is why your nose runs when you cry!',
    tryit: 'Gently touch the inside corner of your eye, near your nose. Your lacrimal bone is just behind there.'
  });
  pair('palatine', {
    region: 'head', name: 'Roof of the mouth bone', sci: 'Palatine bone', say: 'PAL-uh-tyne', level: 3,
    about: 'These L-shaped bones make the back part of the roof of your mouth. They separate your mouth from your nose.',
    fact: 'Because of this bone, you can breathe through your nose while you chew your food!',
    tryit: 'Touch the roof of your mouth with your tongue and slide it back. The hard part at the back is your palatine bones.'
  });
  pair('concha', {
    region: 'head', name: 'Nose scroll bone', sci: 'Inferior nasal concha', say: 'KONG-kuh', level: 3,
    about: 'These curly bones are on the inside walls of your nose. They swirl the air around as you breathe in.',
    fact: '"Concha" means "shell." These bones warm up and clean the air before it reaches your lungs.'
  });
  one('vomer', {
    region: 'head', name: 'Nose wall bone', sci: 'Vomer', say: 'VOH-mur', level: 3,
    about: 'This thin, flat bone is in the middle of your nose. It helps make the wall that splits your nose into two sides.',
    fact: '"Vomer" means "plow" in Latin, because it looks like the blade of a farmer\'s plow.'
  });
  one('mandible', {
    region: 'head', name: 'Jaw bone', sci: 'Mandible', say: 'MAN-dih-bul', level: 1,
    about: 'This is your lower jaw. It holds your bottom teeth and moves up and down when you talk, chew and yawn.',
    fact: 'It is the biggest and strongest bone in your face, and it is the only skull bone you can move on purpose!',
    tryit: 'Open and close your mouth. Your mandible is doing all the moving.'
  });
  one('hyoid', {
    region: 'head', name: 'Throat bone', sci: 'Hyoid bone', say: 'HY-oyd', level: 2,
    about: 'This U-shaped bone is in your neck, just under your chin. It holds up your tongue and helps you swallow and talk.',
    fact: 'It is the only bone in your body that does not touch any other bone! Muscles hold it in place.',
    tryit: 'Swallow and feel your throat move. Your hyoid bone moves up and down too.'
  });

  /* ---------------- EARS ---------------- */
  pair('malleus', {
    region: 'ears', name: 'Hammer bone', sci: 'Malleus', say: 'MAL-ee-us', level: 2,
    about: 'This tiny bone is attached to your ear drum. When sound makes the ear drum shake, the hammer shakes too.',
    fact: '"Malleus" means "hammer" in Latin, and that is what it looks like!'
  });
  pair('incus', {
    region: 'ears', name: 'Anvil bone', sci: 'Incus', say: 'ING-kus', level: 2,
    about: 'This tiny bone sits in the middle. It passes the shakes from the hammer to the stirrup.',
    fact: '"Incus" means "anvil," the heavy block a blacksmith hammers on.'
  });
  pair('stapes', {
    region: 'ears', name: 'Stirrup bone', sci: 'Stapes', say: 'STAY-peez', level: 1,
    about: 'This bone pushes the sound shakes into your inner ear, where they turn into messages for your brain.',
    fact: 'It is the smallest bone in your whole body, about the size of a grain of rice! It is shaped like a stirrup, the foot holder on a horse saddle.'
  });

  /* ---------------- SPINE ---------------- */
  one('c1', {
    region: 'spine', name: 'Atlas (top neck bone)', sci: 'Atlas (C1)', say: 'AT-lus', level: 2,
    about: 'This ring-shaped bone is the very top of your backbone. Your skull rests right on it.',
    fact: 'It is named after Atlas, a giant in Greek stories who held up the sky. This bone holds up your head! It lets you nod "yes."',
    tryit: 'Nod your head "yes." Your skull is rocking on your atlas.'
  });
  one('c2', {
    region: 'spine', name: 'Axis (pivot neck bone)', sci: 'Axis (C2)', say: 'AK-sis', level: 2,
    about: 'This bone has a little peg that pokes up into the atlas. The atlas spins around the peg.',
    fact: 'The axis is what lets you shake your head "no"!',
    tryit: 'Shake your head "no." The atlas is turning around the peg of your axis.'
  });
  for (let i = 3; i <= 7; i++) {
    one('c' + i, {
      region: 'spine', name: `Neck bone ${i}`, sci: `Cervical vertebra (C${i})`, say: 'SER-vih-kul VUR-tuh-bruh', level: 3,
      about: `This is neck bone number ${i} of 7. Your neck bones are small and let you look up, down and all around.`,
      fact: i === 7 ? 'This one sticks out the most. You can feel it as the big bump at the bottom of the back of your neck!'
        : 'A giraffe has a super long neck, but it has 7 neck bones, just like you! Its bones are just much bigger.',
      tryit: i === 7 ? 'Bend your head forward and feel the bump at the bottom of your neck. That is C7!' : undefined
    });
  }
  const thFacts = [
    'Each of these 12 bones holds onto a pair of ribs.',
    'The bumps you can feel down the middle of your back are the tips of these bones.',
    'Between every two backbones is a squishy cushion called a disc. It works like a shock absorber.',
    'You are a tiny bit taller in the morning! The discs between your backbones squish down during the day.',
    'Astronauts grow up to 5 cm taller in space, because there is no gravity squishing their backbones.'
  ];
  for (let i = 1; i <= 12; i++) {
    one('t' + i, {
      region: 'spine', name: `Middle back bone ${i}`, sci: `Thoracic vertebra (T${i})`, say: 'thuh-RAS-ik VUR-tuh-bruh', level: 3,
      about: `This is backbone number ${i} of 12 in your middle back. Rib pair number ${i} connects to it.`,
      fact: thFacts[(i - 1) % thFacts.length]
    });
  }
  for (let i = 1; i <= 5; i++) {
    one('l' + i, {
      region: 'spine', name: `Lower back bone ${i}`, sci: `Lumbar vertebra (L${i})`, say: 'LUM-bar VUR-tuh-bruh', level: 3,
      about: `This is lower-back bone number ${i} of 5. These are the biggest backbones because they hold up most of your body weight.`,
      fact: i === 5 ? 'L5 carries the most weight of any backbone. It sits right on top of the sacrum.'
        : 'Your lower back bones let you bend forward to touch your toes.',
      tryit: 'Bend forward and try to touch your toes, then stand back up. Your lumbar bones did a lot of that bending.'
    });
  }
  one('sacrum', {
    region: 'spine', name: 'Sacrum', sci: 'Sacrum', say: 'SAY-krum', level: 1,
    about: 'This triangle-shaped bone is at the bottom of your backbone, between your hip bones. It connects your spine to your hips.',
    fact: 'When you were little it was 5 separate bones. They join together into one by the time you are a grown-up!'
  });
  one('coccyx', {
    region: 'spine', name: 'Tailbone', sci: 'Coccyx', say: 'KOK-siks', level: 1,
    about: 'This little bone is at the very bottom of your backbone. Some muscles hold onto it.',
    fact: 'It is a leftover from a tail! Long, long ago, our animal ancestors had tails. "Coccyx" means "cuckoo," because it looks like a cuckoo bird\'s beak.',
    tryit: 'Sit on a hard chair and rock back. That little point you feel is near your tailbone.'
  });

  /* ---------------- CHEST ---------------- */
  one('sternum', {
    region: 'chest', name: 'Breastbone', sci: 'Sternum', say: 'STER-num', level: 1,
    about: 'This flat bone is in the middle of your chest. Your top 7 pairs of ribs connect to it with bendy cartilage.',
    fact: 'It is shaped like a sword! The top part is even called the "handle" and the bottom tip is called the "sword tip."',
    tryit: 'Put your hand in the middle of your chest. That flat hard bone is your sternum.'
  });
  for (let i = 1; i <= 12; i++) {
    const kind = i <= 7 ? 'true' : i <= 10 ? 'false' : 'floating';
    let about = `This is rib number ${i}. `;
    if (kind === 'true') about += 'It is a "true rib" because it connects straight to your breastbone with bendy cartilage.';
    else if (kind === 'false') about += 'It is a "false rib" because it connects to the rib above it instead of straight to your breastbone.';
    else about += 'It is a "floating rib" because its front end does not connect to anything!';
    const facts = {
      1: 'Rib 1 is the shortest, flattest and most curved rib. It hides just under your collarbone.',
      7: 'Rib 7 is the last "true rib" that reaches all the way to your breastbone.',
      11: 'Floating ribs are short and help protect your kidneys.',
      12: 'Rib 12 is the very last and shortest floating rib.'
    };
    pair('rib' + i, {
      region: 'chest', name: `Rib ${i}`, sci: `${ordinal(i)} rib (${kind} rib)`, say: 'rib', level: i === 1 || i === 12 ? 2 : 3,
      about,
      fact: facts[i] || 'Most people have 12 pairs of ribs. Your ribs move every time you breathe in and out, about 20,000 times a day!',
      tryit: kind === 'floating' ? 'Press gently on your sides above your waist. You might feel the ends of your floating ribs.' : 'Take a deep breath with your hands on your ribs. Feel them move out!'
    });
  }

  /* ---------------- SHOULDERS ---------------- */
  pair('clavicle', {
    region: 'shoulders', name: 'Collarbone', sci: 'Clavicle', say: 'KLAV-ih-kul', level: 1,
    about: 'This long, curvy bone goes across the top of your chest from your breastbone to your shoulder. It holds your arm out to the side.',
    fact: '"Clavicle" means "little key," because it twists like an old key in a lock when you lift your arm.',
    tryit: 'Feel along the top of your chest. The bone that curves out to your shoulder is your collarbone.'
  });
  pair('scapula', {
    region: 'shoulders', name: 'Shoulder blade', sci: 'Scapula', say: 'SKAP-yoo-luh', level: 1,
    about: 'This flat triangle bone is on your upper back. Your arm bone fits into a little cup on its side, and lots of muscles hold onto it.',
    fact: 'People sometimes call them "wing bones," because they stick out like little wings when you push your arms back.',
    tryit: 'Reach across and touch your back near your shoulder. Now move your arm. Feel the bone slide around?'
  });

  /* ---------------- ARMS ---------------- */
  pair('humerus', {
    region: 'arms', name: 'Upper arm bone', sci: 'Humerus', say: 'HYOO-mer-us', level: 1,
    about: 'This is the long bone in your upper arm, from your shoulder to your elbow. Its round top fits into your shoulder like a ball in a cup.',
    fact: 'Ever bumped your "funny bone"? It is not a bone, it is a nerve near the bottom of the humerus. And "humerus" sounds like "humorous"!',
    tryit: 'Squeeze your upper arm. The hard part in the middle is your humerus.'
  });
  pair('radius', {
    region: 'arms', name: 'Thumb-side forearm bone', sci: 'Radius', say: 'RAY-dee-us', level: 1,
    about: 'This forearm bone is on the same side as your thumb. It rolls over the ulna so you can turn your hand palm-up and palm-down.',
    fact: 'The radius is the arm bone people break most often, usually by falling onto an outstretched hand.',
    tryit: 'Turn your hand over and back like you are turning a doorknob. Your radius is rolling!'
  });
  pair('ulna', {
    region: 'arms', name: 'Pinky-side forearm bone', sci: 'Ulna', say: 'UL-nuh', level: 1,
    about: 'This forearm bone is on the same side as your pinky finger. Its top end makes the pointy part of your elbow.',
    fact: 'When you lean on your elbow, you are resting on your ulna!',
    tryit: 'Bend your arm and feel the pointy tip of your elbow. That is the top of your ulna.'
  });

  /* ---------------- HANDS ---------------- */
  const carpals = [
    ['scaphoid', 'Boat wrist bone', 'Scaphoid', 'SKAF-oyd', 'This wrist bone is on the thumb side, right next to the radius.', 'It is shaped like a little boat. It is the wrist bone that breaks most often.', 2],
    ['lunate', 'Moon wrist bone', 'Lunate', 'LOO-nayt', 'This wrist bone sits in the middle of the first row of wrist bones.', '"Lunate" means "moon," because it is shaped like a half-moon.', 3],
    ['triquetrum', 'Triangle wrist bone', 'Triquetrum', 'try-KWEE-trum', 'This wrist bone is on the pinky side of your wrist.', '"Triquetrum" means "three-cornered," because it is shaped like a pyramid.', 3],
    ['pisiform', 'Pea wrist bone', 'Pisiform', 'PY-sih-form', 'This little round bone sits on top of the triquetrum, on the palm side of your wrist.', '"Pisiform" means "pea-shaped." It is the smallest wrist bone, and it grows inside a tendon!', 2],
    ['trapezium', 'Thumb-base wrist bone', 'Trapezium', 'truh-PEE-zee-um', 'This wrist bone is at the bottom of your thumb. It has a saddle-shaped joint.', 'This saddle joint is what lets your thumb touch each of your fingertips. Monkeys and people are great at this!', 3],
    ['trapezoid', 'Small wedge wrist bone', 'Trapezoid', 'TRAP-uh-zoyd', 'This wrist bone sits at the bottom of your pointer finger bone.', 'It is the smallest bone in the second row of wrist bones.', 3],
    ['capitate', 'Head wrist bone', 'Capitate', 'KAP-ih-tayt', 'This is the biggest wrist bone. It is right in the middle of your wrist.', '"Capitate" means "having a head," because one end is round like a head.', 2],
    ['hamate', 'Hook wrist bone', 'Hamate', 'HAY-mayt', 'This wrist bone is on the pinky side, at the bottom of your ring and pinky fingers.', 'It has a little hook sticking out! "Hamate" means "hooked."', 3]
  ];
  for (const [id, name, sci, say, about, fact, level] of carpals) {
    pair(id, { region: 'hands', name, sci, say, level, about: about + ' You have 8 wrist bones in each wrist.', fact, tryit: 'Wiggle your wrist in a circle. All 8 wrist bones slide against each other.' });
  }
  const fingers = { 1: 'thumb', 2: 'pointer finger', 3: 'middle finger', 4: 'ring finger', 5: 'pinky finger' };
  const fingerSci = { 1: 'thumb', 2: 'index finger', 3: 'middle finger', 4: 'ring finger', 5: 'little finger' };
  for (let f = 1; f <= 5; f++) {
    pair('mc' + f, {
      region: 'hands', name: `Palm bone (${fingers[f]})`, sci: `${ordinal(f)} metacarpal`, say: 'met-uh-KAR-pul', level: f === 1 ? 2 : 3,
      about: `This long bone is inside your palm, leading to your ${fingers[f]}. You have 5 palm bones in each hand.`,
      fact: f === 1 ? 'Your thumb\'s palm bone is short and can move a lot. That is what makes your thumb so useful!' : 'The knuckles you see when you make a fist are the ends of your palm bones!',
      tryit: 'Make a fist and look at your knuckles. Each bump is the end of a palm bone.'
    });
  }
  const phalanxFacts = [
    'Each finger bone is called a "phalanx." The word comes from ancient soldiers who stood in neat rows, like your finger bones!',
    'Your fingers have no muscles inside them. Long strings called tendons pull on your finger bones from muscles in your arm.',
    'Your two hands have 54 bones. That is more than a quarter of all the bones in your body!'
  ];
  let pf = 0;
  for (let f = 1; f <= 5; f++) {
    const parts = f === 1 ? [['pp', 'bottom', 'Proximal phalanx'], ['dp', 'tip', 'Distal phalanx']]
      : [['pp', 'bottom', 'Proximal phalanx'], ['ip', 'middle', 'Middle phalanx'], ['dp', 'tip', 'Distal phalanx']];
    for (const [p, where, sciName] of parts) {
      pair(p + f, {
        region: 'hands', name: `${cap(fingers[f])} ${where} bone`, sci: `${sciName} of the ${fingerSci[f]}`, say: 'FAY-lanks', level: f === 1 || (f === 3 && p === 'dp') ? 2 : 3,
        about: `This is the ${where} bone of your ${fingers[f]}. ` + (f === 1 ? 'Your thumb has only 2 bones, but your other fingers have 3.' : 'Each finger has 3 bones: bottom, middle and tip.'),
        fact: p === 'dp' ? 'The tip bones have a flat, wide end that supports your fingernail and the soft pad of your fingertip.' : phalanxFacts[pf++ % phalanxFacts.length],
        tryit: f === 1 ? 'Bend your thumb. It bends in only one place, because it has just 2 bones!' : `Bend your ${fingers[f]}. Can you see where the bones meet?`
      });
    }
  }

  /* ---------------- HIPS ---------------- */
  pair('hip', {
    region: 'hips', name: 'Hip bone', sci: 'Hip bone (os coxae)', say: 'OS KOK-see', level: 1,
    about: 'This big bone makes one side of your pelvis. Your thigh bone fits into a deep round cup on its side, making your hip joint.',
    fact: 'When you were a baby, each hip bone was 3 separate bones: the ilium, ischium and pubis. They join into one. And when you sit, you are sitting on your ischium!',
    tryit: 'Put your hands on your hips. The hard edge you feel is the top of your hip bones.'
  });

  /* ---------------- LEGS ---------------- */
  pair('femur', {
    region: 'legs', name: 'Thigh bone', sci: 'Femur', say: 'FEE-mur', level: 1,
    about: 'This is the bone in your thigh, from your hip to your knee. Its round top fits into your hip like a ball in a cup.',
    fact: 'It is the longest and strongest bone in your body! It is about one quarter of your height, and stronger than concrete.',
    tryit: 'Sit down and squeeze your thigh. The hard bone deep inside is your femur.'
  });
  pair('patella', {
    region: 'legs', name: 'Kneecap', sci: 'Patella', say: 'puh-TEL-uh', level: 1,
    about: 'This flat, round bone sits at the front of your knee. It protects your knee and helps your leg muscles work better.',
    fact: 'Babies are born without bony kneecaps! Their kneecaps are made of soft cartilage and turn into bone when they are about 3 to 5 years old.',
    tryit: 'Sit with your leg straight and relaxed. Gently wiggle your kneecap side to side.'
  });
  pair('tibia', {
    region: 'legs', name: 'Shin bone', sci: 'Tibia', say: 'TIB-ee-uh', level: 1,
    about: 'This is the big bone at the front of your lower leg. It carries your weight from your knee down to your ankle.',
    fact: 'It is the second longest bone in your body. The bump on the inside of your ankle is the bottom of your tibia!',
    tryit: 'Run your finger down the front of your leg below the knee. That hard edge is your shin bone.'
  });
  pair('fibula', {
    region: 'legs', name: 'Thin leg bone', sci: 'Fibula', say: 'FIB-yoo-luh', level: 1,
    about: 'This skinny bone runs down the outside of your lower leg, next to your shin bone. Muscles hold onto it, and it helps keep your ankle steady.',
    fact: 'It carries hardly any of your weight. The bump on the outside of your ankle is the bottom of your fibula!',
    tryit: 'Feel the bump on the outside of your ankle. That is the end of your fibula.'
  });

  /* ---------------- FEET ---------------- */
  const tarsals = [
    ['talus', 'Ankle bone', 'Talus', 'TAY-lus', 'This bone is the top of your foot. Your shin bones sit on it to make your ankle joint.', 'Long ago, people made dice out of animal ankle bones and played games with them!', 1],
    ['calcaneus', 'Heel bone', 'Calcaneus', 'kal-KAY-nee-us', 'This is the biggest bone in your foot. It makes your heel and hits the ground first when you walk.', 'Your strongest tendon, the Achilles tendon, pulls on your heel bone when you stand on tiptoe.', 1],
    ['navicular', 'Boat foot bone', 'Navicular', 'nuh-VIK-yoo-lur', 'This bone is on the inside of your foot, in front of the ankle bone. It helps hold up the arch of your foot.', '"Navicular" means "little boat," because of its curved shape.', 2],
    ['cuboid', 'Cube foot bone', 'Cuboid', 'KYOO-boyd', 'This bone is on the outside edge of your foot. It connects your heel to your two smallest toes.', 'It is shaped a bit like a cube, or a dice!', 2],
    ['cuneiform-med', 'Big wedge foot bone', 'Medial cuneiform', 'kyoo-NEE-ih-form', 'This is the biggest of the 3 wedge bones. It sits behind your big toe.', '"Cuneiform" means "wedge-shaped." Ancient people wrote with wedge-shaped marks called cuneiform writing!', 3],
    ['cuneiform-int', 'Middle wedge foot bone', 'Intermediate cuneiform', 'kyoo-NEE-ih-form', 'This is the smallest of the 3 wedge bones. It sits behind your second toe.', 'The 3 wedge bones fit together like the stones in an arch bridge, making the arch of your foot.', 3],
    ['cuneiform-lat', 'Outer wedge foot bone', 'Lateral cuneiform', 'kyoo-NEE-ih-form', 'This wedge bone sits behind your middle toe.', 'The arch of your foot works like a spring when you run and jump.', 3]
  ];
  for (const [id, name, sci, say, about, fact, level] of tarsals) {
    pair(id, {
      region: 'feet', name, sci, say, level, about: about + ' You have 7 ankle and back-of-foot bones in each foot.', fact,
      tryit: id === 'calcaneus' ? 'Stand on your tiptoes. Your Achilles tendon is pulling up your heel bone!' : id === 'talus' ? 'Point and flex your foot. Your foot is rocking on your talus.' : undefined
    });
  }
  const toes = { 1: 'big toe', 2: 'second toe', 3: 'middle toe', 4: 'fourth toe', 5: 'little toe' };
  for (let t = 1; t <= 5; t++) {
    pair('mt' + t, {
      region: 'feet', name: `Foot bone (${toes[t]})`, sci: `${ordinal(t)} metatarsal`, say: 'met-uh-TAR-sul', level: t === 1 ? 2 : 3,
      about: `This long bone in the middle of your foot leads to your ${toes[t]}. You have 5 of these in each foot.`,
      fact: t === 1 ? 'This is the thickest foot bone in the middle of your foot. It pushes you off the ground when you walk.' : t === 5 ? 'This bone has a bump on its outside edge that you can feel halfway along your foot.' : 'Your metatarsals help make the arch of your foot.',
      tryit: 'Feel the top of your foot. Those long bones under the skin are your metatarsals.'
    });
  }
  for (let t = 1; t <= 5; t++) {
    const parts = t === 1 ? [['tpp', 'bottom', 'Proximal phalanx'], ['tdp', 'tip', 'Distal phalanx']]
      : [['tpp', 'bottom', 'Proximal phalanx'], ['tip', 'middle', 'Middle phalanx'], ['tdp', 'tip', 'Distal phalanx']];
    for (const [p, where, sciName] of parts) {
      pair(p + t, {
        region: 'feet', name: `${cap(toes[t])} ${where} bone`, sci: `${sciName} of the ${toes[t]}`, say: 'FAY-lanks', level: t === 1 ? 2 : 3,
        about: `This is the ${where} bone of your ${toes[t]}. ` + (t === 1 ? 'Your big toe has only 2 bones, just like your thumb!' : 'Your smaller toes each have 3 bones.'),
        fact: t === 1 ? 'Your big toe carries a lot of your weight and helps you balance.' : t === 5 && p === 'tip' ? 'Some people only have 2 bones in their little toe because the middle and tip bones grow together!' : 'Your toe bones help you balance and push off when you walk and run.',
        tryit: 'Wiggle your toes! Can you move just your big toe?'
      });
    }
  }

  function ordinal(n) { return n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'); }
  function cap(s) { return s[0].toUpperCase() + s.slice(1); }

  SK.BONES = list;
  SK.BONE = {};
  for (const b of list) SK.BONE[b.id] = b;
  SK.regionOf = id => SK.REGIONS.find(r => r.id === id);
  SK.fullName = b => b.name + (b.side ? ` (${b.side})` : '');

  SK.FUN_FACTS = [
    'You were born with about 300 bones! Some of them join together as you grow, so grown-ups have 206.',
    'More than half of your bones are in your hands and feet!',
    'Bones are alive! They grow, and they can fix themselves when they break.',
    'The inside of many bones is soft and spongy. It makes new blood cells, millions every second!',
    'Your bones need calcium to stay strong. You can find it in milk, cheese, yogurt and leafy greens.',
    'Your smallest bone (the stirrup, in your ear) is about the size of a grain of rice.',
    'Your biggest bone, the thigh bone, is about one quarter of your height.',
    'Every 10 years or so, your body has replaced almost all of its bone with new bone!',
    'Sharks do not have any bones. Their skeletons are made of cartilage, like the tip of your nose.'
  ];
})(window.SK);
