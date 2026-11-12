# JAM at a glance

**In one sentence:** a JAM network takes in work, does it on a few validators, and has
all of them apply the result.

Optional, and no code. Every piece comes back in its own lesson, so nothing here needs to
stick yet.

JAM is a blockchain run by *validators*: computers that take turns adding a block. There
is one every 6 seconds, a *slot*. The work people send in is done on *cores*. A core isn't
a machine. It's a lane of work, run at any moment by three validators, its *guarantors*,
who switch to another core every few slots. Everyone else keeps a piece of the work, says
they hold it, and applies the result once enough of them do.

Here it is in miniature. *Tiny* is the small configuration your client tests on: 6
validators and 2 cores, whose guarantors switch every 4 slots (24 seconds). Press play to
watch a real chain in slow motion, one block a slot.

<SlotPlayer />

Or take it one step at a time: follow a work-package through its trip, and slide the slot
to watch the guarantors move.

<JamNetwork only="tiny" />

The real network works the same way, only bigger: [lesson 4.2](./04-blocks/02-tiny-and-full.md) shows it.

Ready to build one? [Start here](./index.md).
