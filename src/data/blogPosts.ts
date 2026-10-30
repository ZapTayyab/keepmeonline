import type { LucideIcon } from 'lucide-react';
import { Battery, Wifi, Laptop, Zap, Lightbulb, Plug } from 'lucide-react';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  icon: LucideIcon;
  content: BlogContentSection[];
}

export interface BlogContentSection {
  heading: string;
  paragraphs: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    slug: 'choosing-the-right-ups-for-your-router',
    title: 'Choosing the Right UPS for Your Wi-Fi Router',
    excerpt:
      'A router draws very little power, but keeping it online during an outage means picking a UPS with enough capacity and the right output type. Here is what to look for.',
    category: 'Equipment',
    readTime: '4 min',
    date: '2026-10-20',
    icon: Wifi,
    content: [
      {
        heading: 'Why a small UPS is usually enough',
        paragraphs: [
          'A typical Wi-Fi router draws between 6 and 15 watts. A fiber ONT adds another 5 to 10 watts. Together, they are among the lowest-power devices in your home, which means even a small uninterruptible power supply can keep your internet running for hours.',
          'The key is matching the UPS capacity to your target outage duration. A 300 Wh UPS with 80% usable capacity and 85% inverter efficiency can power a 18 W router-plus-ONT combo for roughly 11 hours.',
        ],
      },
      {
        heading: 'DC versus AC output',
        paragraphs: [
          'Many routers accept DC power directly (usually 12 V). If your UPS has a DC output, you can skip the inverter entirely and avoid its conversion losses. This can extend runtime by 10-15% compared to running the router through an AC inverter.',
          'Check your router power adapter for its voltage and current rating. If it says 12V and 1A, the router draws up to 12 W. A DC-to-DC cable from your UPS may be more efficient than using the AC outlet.',
        ],
      },
      {
        heading: 'What capacity do you need?',
        paragraphs: [
          'Use the Keep Me Online calculator with your router wattage, a target outage duration, and your UPS specs to estimate runtime. As a rough rule, a 500 Wh power station can keep most internet equipment running for a full workday during a power cut.',
        ],
      },
    ],
  },
  {
    id: '2',
    slug: 'understanding-battery-capacity-wh-vs-ah',
    title: 'Understanding Battery Capacity: Wh vs Ah',
    excerpt:
      'Watt-hours and amp-hours measure different things. Confusing them leads to wildly wrong runtime estimates. Here is the simple relationship and why it matters.',
    category: 'Basics',
    readTime: '5 min',
    date: '2026-10-18',
    icon: Battery,
    content: [
      {
        heading: 'The difference in one formula',
        paragraphs: [
          'Watt-hours (Wh) = Volts (V) x Amp-hours (Ah). This single formula is the source of most battery capacity confusion. Two batteries with the same Ah rating but different voltages store very different amounts of energy.',
          'A 12 V, 100 Ah battery stores 1,200 Wh. A 24 V, 50 Ah battery also stores 1,200 Wh. Same energy, different voltage and capacity ratings.',
        ],
      },
      {
        heading: 'Why labels can mislead',
        paragraphs: [
          'Portable power stations usually list capacity in Wh, which is what you want. But lead-acid batteries and some lithium batteries are rated in Ah at a specific voltage. If you see a 100 Ah battery, you must also know its voltage to calculate watt-hours.',
          'Some manufacturers list the internal cell capacity in Ah at 3.7 V (the lithium cell voltage), which makes the number look larger than the actual AC output energy. Always check whether the Wh figure refers to the battery cells or the AC output.',
        ],
      },
      {
        heading: 'Using this in the calculator',
        paragraphs: [
          'If your battery is rated in Wh, enter it directly. If it is rated in V and Ah, switch the calculator to that mode and enter both values. The calculator multiplies them for you.',
        ],
      },
    ],
  },
  {
    id: '3',
    slug: 'laptop-battery-backup-during-power-cuts',
    title: 'How Long Can a Laptop Run During a Power Cut?',
    excerpt:
      'A laptop has its own battery, but during a long outage you may need to charge it from your backup. Here is how to estimate the cost and plan for it.',
    category: 'Planning',
    readTime: '4 min',
    date: '2026-10-15',
    icon: Laptop,
    content: [
      {
        heading: 'The laptop is the biggest draw',
        paragraphs: [
          'While a router sips power at 10 W, a laptop under active use can draw 30-65 W. On a 500 Wh backup battery, adding a 45 W laptop to your router and ONT cuts runtime from about 11 hours down to roughly 3 hours.',
          'This is why the Keep Me Online scenario comparison ranks nonessential devices by battery-side consumption. The laptop is almost always the biggest factor.',
        ],
      },
      {
        heading: 'Charging behavior is not constant',
        paragraphs: [
          'A laptop draws the most power while its battery is charging, and much less once the battery is full. The calculator uses a steady average load, which overestimates draw if your laptop battery is already charged.',
          'If your laptop starts the outage at 100%, you can set a lower duty percentage (try 40-60%) to model the intermittent charging behavior more realistically.',
        ],
      },
      {
        heading: 'Practical tips',
        paragraphs: [
          'Lower your screen brightness, close unnecessary applications, and enable battery saver mode. These steps can cut your laptop power draw by 30-50%, meaningfully extending your backup runtime.',
        ],
      },
    ],
  },
  {
    id: '4',
    slug: 'inverter-efficiency-explained',
    title: 'Inverter Efficiency Explained: Where Does Your Energy Go?',
    excerpt:
      'Your inverter loses energy converting DC to AC. Understanding how much helps you predict runtime more accurately and decide between AC and DC power paths.',
    category: 'Basics',
    readTime: '6 min',
    date: '2026-10-12',
    icon: Zap,
    content: [
      {
        heading: 'Conversion is never 100%',
        paragraphs: [
          'An inverter converts the DC energy from your battery into the AC power your devices expect. This process is typically 80-90% efficient. The remaining 10-20% is lost as heat.',
          'If your inverter is 85% efficient and your AC devices draw 100 W, the battery actually supplies about 118 W. The extra 18 W is wasted as heat in the inverter.',
        ],
      },
      {
        heading: 'Idle draw adds up over time',
        paragraphs: [
          'Inverters consume a small amount of power just by being switched on, even with nothing plugged in. This idle draw is typically 2-10 W. Over a long outage, it adds up.',
          'A 5 W idle draw over 10 hours consumes 50 Wh of your battery. On a 500 Wh battery with 360 Wh of planning energy, that is nearly 14% of your available energy spent on nothing.',
        ],
      },
      {
        heading: 'When to use DC directly',
        paragraphs: [
          'If your device can run on DC (many routers, LED lights, and phone chargers can), connecting it directly to the battery avoids inverter losses entirely. The calculator lets you assign each device an AC or DC power path so you can model both scenarios.',
        ],
      },
    ],
  },
  {
    id: '5',
    slug: 'power-cut-checklist-for-remote-workers',
    title: 'Power-Cut Checklist for Remote Workers',
    excerpt:
      'When you work from home, a power cut does not just mean no lights. It means dropped calls, missed deadlines, and lost work. Here is a practical checklist.',
    category: 'Planning',
    readTime: '5 min',
    date: '2026-10-08',
    icon: Lightbulb,
    content: [
      {
        heading: 'Before the outage',
        paragraphs: [
          'Know your battery capacity and device wattages. Run the Keep Me Online calculator with your actual setup so you know your expected runtime before you need it.',
          'Keep your laptop charged. Start every workday above 80% battery so you have native laptop runtime even if your backup runs out.',
        ],
      },
      {
        heading: 'During the outage',
        paragraphs: [
          'Switch off nonessential devices immediately. Every watt you do not use extends your runtime. The scenario comparison in the calculator shows which devices to turn off first.',
          'Reduce laptop brightness and close heavy applications. If your meeting platform allows audio-only, switch off video to cut your laptop power draw significantly.',
        ],
      },
      {
        heading: 'After the outage',
        paragraphs: [
          'Recharge your backup battery as soon as power returns. Note how long the outage lasted and compare it to your estimated runtime so you can adjust your setup for next time.',
        ],
      },
    ],
  },
  {
    id: '6',
    slug: 'lead-acid-vs-lithium-for-backup-power',
    title: 'Lead-Acid vs Lithium for Backup Power',
    excerpt:
      'Both battery types can keep you online, but they behave differently under load and have very different usable capacity. Here is what it means for your runtime estimate.',
    category: 'Equipment',
    readTime: '6 min',
    date: '2026-10-05',
    icon: Plug,
    content: [
      {
        heading: 'Usable capacity is the big difference',
        paragraphs: [
          'A lead-acid battery should typically not be discharged below 50% of its nominal capacity. A lithium battery can often use 80-90% of its capacity. This means a 100 Ah lead-acid battery at 12 V gives you about 600 Wh of usable energy, while a comparable lithium battery gives you 860-1000 Wh.',
          'The usable percentage setting in the calculator models this difference. Set it to 50% for lead-acid and 80-90% for lithium, based on the manufacturer specification.',
        ],
      },
      {
        heading: 'Discharge rate affects lead-acid more',
        paragraphs: [
          'Lead-acid batteries deliver less total energy when discharged quickly (Peukert effect). A battery rated for 100 Ah at a 20-hour discharge rate may only deliver 60-70 Ah if discharged in 2 hours.',
          'The calculator does not model this effect. If you are using lead-acid and drawing high power relative to battery size, your actual runtime may be shorter than the estimate.',
        ],
      },
      {
        heading: 'Which should you choose?',
        paragraphs: [
          'For low-draw backup (router and ONT only), either type works. For higher draws (laptop, monitor, fan), lithium generally delivers more usable energy in a lighter package. The calculator helps you compare scenarios regardless of chemistry.',
        ],
      },
    ],
  },
];
