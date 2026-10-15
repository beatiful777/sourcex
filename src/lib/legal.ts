import type { Lang } from "@/lib/translations";

export type DocId = "terms" | "privacy";
export type Item = string | { b: string; t: string };
export type Section = { h: string; p?: string; ul?: Item[] };
export type Doc = {
  title: string;
  updated: string;
  sections: Section[];
  contact: { h: string; pre: string; link: string; post: string };
};

// Legal texts, one version per interface language. The English text is the reference version.
export const LEGAL: Record<Lang, Record<DocId, Doc>> = {
  "en": {
    "terms": {
      "title": "Terms of Service",
      "updated": "Last updated: 15 October 2026. SOURCEX is a working prototype provided in private beta.",
      "sections": [
        {
          "h": "1. Nature of the Service",
          "p": "SOURCEX (the “Platform”) is an online sourcing hub through which buyers may publish requests for quotation (“RFQs”) and approved suppliers may submit responses. The Platform serves solely as a means of introduction between users. SOURCEX is not a party to, and assumes no obligations under, any agreement concluded between a buyer and a supplier."
        },
        {
          "h": "2. Accounts",
          "p": "Users shall provide accurate and complete information and shall keep their login credentials confidential. Each user is responsible for all activity carried out under their account. SOURCEX may suspend or terminate any account that violates these Terms or that is used to abuse the Platform."
        },
        {
          "h": "3. Buyers",
          "p": "Buyers shall publish RFQs only in connection with a genuine sourcing requirement. The publication of misleading, unlawful or unsolicited (spam) requests is prohibited."
        },
        {
          "h": "4. Suppliers",
          "p": "A supplier is listed on the Platform only after its application has been reviewed and approved. Suppliers shall provide truthful and accurate company information. Changes to key profile details, such as product categories, may be subject to a new review. SOURCEX may, at its sole discretion, reject, suspend or remove any supplier."
        },
        {
          "h": "5. Quotations and Transactions",
          "p": "Quotations, prices, lead times and product quality are the sole responsibility of the supplier. Buyers and suppliers are solely responsible for their own agreements, payments, shipping and compliance with applicable law. SOURCEX does not guarantee the conduct of any supplier or buyer, or the outcome of any transaction."
        },
        {
          "h": "6. Acceptable Use",
          "p": "Users shall not:",
          "ul": [
            "provide false, misleading or fraudulent information;",
            "attempt to compromise, overload or scrape the Platform; or",
            "engage in harassment or publish unlawful content."
          ]
        },
        {
          "h": "7. Disclaimer of Warranties and Limitation of Liability",
          "p": "During the private beta period the Platform is provided “as is” and “as available”. It may be modified, interrupted or discontinued at any time. To the extent permitted by applicable law, SOURCEX shall not be liable for any loss arising from the use of the Platform."
        },
        {
          "h": "8. Amendments",
          "p": "SOURCEX may amend these Terms from time to time. Continued use of the Platform after an amendment constitutes acceptance of the amended Terms."
        }
      ],
      "contact": {
        "h": "Contact",
        "pre": "Questions regarding these Terms may be submitted through the ",
        "link": "contact form",
        "post": "."
      }
    },
    "privacy": {
      "title": "Privacy Policy",
      "updated": "Last updated: 15 October 2026. SOURCEX is a working prototype provided in private beta.",
      "sections": [
        {
          "h": "1. Personal Data We Collect",
          "ul": [
            {
              "b": "Account data:",
              "t": "email address and password. Passwords are processed by our authentication provider and are not accessible to SOURCEX."
            },
            {
              "b": "RFQs:",
              "t": "the product, quantity, category, deadline and contact details entered by the user."
            },
            {
              "b": "Supplier applications:",
              "t": "company name, product categories, contact details and any other information submitted by the applicant."
            },
            {
              "b": "Messages:",
              "t": "name, email address and message content submitted through the contact form or an inquiry form."
            },
            {
              "b": "Waitlist:",
              "t": "email address, where the user joins a waitlist."
            }
          ]
        },
        {
          "h": "2. Purposes of Processing",
          "p": "Data is used to operate user accounts, display RFQs and quotations, review supplier applications, respond to messages and maintain the security of the Platform. SOURCEX does not sell personal data."
        },
        {
          "h": "3. Access to Data",
          "p": "Data may be accessed by:",
          "ul": [
            "SOURCEX administrators;",
            "approved suppliers, who may view open RFQs that match their product categories; and",
            "service providers that operate the Platform: Supabase (database and authentication hosting) and Vercel (website hosting)."
          ]
        },
        {
          "h": "4. Cookies and Local Storage",
          "p": "Browser storage is used to keep users signed in, to remember the selected interface language and to record which notifications have been viewed. Where CAPTCHA protection is enabled on the sign-in form, its provider (Cloudflare Turnstile) may process technical data in order to detect automated traffic."
        },
        {
          "h": "5. User Rights",
          "p": "Users may request the correction or deletion of their account and data at any time through the contact form. SOURCEX will act on reasonable requests."
        },
        {
          "h": "6. Retention and Security",
          "p": "Data is retained while the account remains active or for as long as necessary to operate the Platform. Access controls are applied to the database; however, no online service can be guaranteed to be completely secure."
        },
        {
          "h": "7. Amendments",
          "p": "This Policy may be updated. The date shown above will be revised whenever an update is made."
        }
      ],
      "contact": {
        "h": "Contact",
        "pre": "Questions regarding this Policy may be submitted through the ",
        "link": "contact form",
        "post": "."
      }
    }
  },
  "ru": {
    "terms": {
      "title": "Условия использования",
      "updated": "Дата последнего обновления: 15 октября 2026 г. SOURCEX является рабочим прототипом и предоставляется в режиме закрытого бета-тестирования.",
      "sections": [
        {
          "h": "1. Характер сервиса",
          "p": "SOURCEX (далее — «Платформа») — это онлайн-площадка для поиска поставщиков, на которой покупатели могут публиковать запросы коммерческих предложений (далее — «RFQ»), а одобренные поставщики — направлять ответы. Платформа служит исключительно средством знакомства пользователей. SOURCEX не является стороной каких-либо соглашений, заключённых между покупателем и поставщиком, и не принимает на себя обязательств по ним."
        },
        {
          "h": "2. Учётные записи",
          "p": "Пользователи обязаны предоставлять точные и полные сведения и сохранять конфиденциальность своих учётных данных. Каждый пользователь несёт ответственность за все действия, совершённые под его учётной записью. SOURCEX вправе приостановить или удалить любую учётную запись, нарушающую настоящие Условия или используемую для злоупотреблений на Платформе."
        },
        {
          "h": "3. Покупатели",
          "p": "Покупатели обязаны публиковать RFQ только при наличии реальной потребности в закупке. Публикация вводящих в заблуждение, незаконных или нежелательных (спам) запросов запрещена."
        },
        {
          "h": "4. Поставщики",
          "p": "Поставщик размещается на Платформе только после рассмотрения и одобрения его заявки. Поставщики обязаны предоставлять достоверные и точные сведения о компании. Изменение ключевых данных профиля, например категорий продукции, может потребовать повторной проверки. SOURCEX вправе по собственному усмотрению отклонить, приостановить или удалить любого поставщика."
        },
        {
          "h": "5. Предложения и сделки",
          "p": "Предложения, цены, сроки изготовления и качество продукции находятся в исключительной ответственности поставщика. Покупатели и поставщики самостоятельно отвечают за свои соглашения, платежи, доставку и соблюдение применимого законодательства. SOURCEX не гарантирует добросовестность какого-либо поставщика или покупателя, а также результат какой-либо сделки."
        },
        {
          "h": "6. Допустимое использование",
          "p": "Пользователям запрещается:",
          "ul": [
            "предоставлять ложные, вводящие в заблуждение или мошеннические сведения;",
            "предпринимать попытки нарушить работу Платформы, перегрузить её или автоматически собирать с неё данные;",
            "осуществлять преследование или публиковать незаконный контент."
          ]
        },
        {
          "h": "7. Отказ от гарантий и ограничение ответственности",
          "p": "В период закрытого бета-тестирования Платформа предоставляется «как есть» и «по мере доступности». Она может быть изменена, прервана или закрыта в любое время. В пределах, допускаемых применимым законодательством, SOURCEX не несёт ответственности за убытки, возникшие в связи с использованием Платформы."
        },
        {
          "h": "8. Изменения",
          "p": "SOURCEX вправе время от времени изменять настоящие Условия. Продолжение использования Платформы после внесения изменений означает принятие новой редакции."
        }
      ],
      "contact": {
        "h": "Контакты",
        "pre": "Вопросы, касающиеся настоящих Условий, можно направить через ",
        "link": "форму обратной связи",
        "post": "."
      }
    },
    "privacy": {
      "title": "Политика конфиденциальности",
      "updated": "Дата последнего обновления: 15 октября 2026 г. SOURCEX является рабочим прототипом и предоставляется в режиме закрытого бета-тестирования.",
      "sections": [
        {
          "h": "1. Персональные данные, которые мы собираем",
          "ul": [
            {
              "b": "Данные учётной записи:",
              "t": "адрес электронной почты и пароль. Пароли обрабатываются нашим провайдером аутентификации и недоступны SOURCEX."
            },
            {
              "b": "RFQ:",
              "t": "товар, количество, категория, срок и контактные данные, указанные пользователем."
            },
            {
              "b": "Заявки поставщиков:",
              "t": "название компании, категории продукции, контактные данные и иные сведения, предоставленные заявителем."
            },
            {
              "b": "Сообщения:",
              "t": "имя, адрес электронной почты и текст сообщения, отправленные через форму обратной связи или форму запроса."
            },
            {
              "b": "Список ожидания:",
              "t": "адрес электронной почты, если пользователь записывается в список ожидания."
            }
          ]
        },
        {
          "h": "2. Цели обработки",
          "p": "Данные используются для ведения учётных записей, отображения RFQ и коммерческих предложений, рассмотрения заявок поставщиков, ответов на сообщения и обеспечения безопасности Платформы. SOURCEX не продаёт персональные данные."
        },
        {
          "h": "3. Доступ к данным",
          "p": "К данным могут иметь доступ:",
          "ul": [
            "администраторы SOURCEX;",
            "одобренные поставщики, которые видят открытые RFQ, соответствующие их категориям продукции;",
            "поставщики услуг, обеспечивающие работу Платформы: Supabase (хостинг базы данных и аутентификации) и Vercel (хостинг сайта)."
          ]
        },
        {
          "h": "4. Файлы cookie и локальное хранилище",
          "p": "Хранилище браузера используется для сохранения входа пользователя в систему, запоминания выбранного языка интерфейса и отметок о просмотренных уведомлениях. Если на форме входа включена защита CAPTCHA, её провайдер (Cloudflare Turnstile) может обрабатывать технические данные для выявления автоматизированного трафика."
        },
        {
          "h": "5. Права пользователей",
          "p": "Пользователь может в любое время запросить исправление или удаление своей учётной записи и данных через форму обратной связи. SOURCEX рассматривает обоснованные запросы и действует по ним."
        },
        {
          "h": "6. Хранение и безопасность",
          "p": "Данные хранятся, пока учётная запись остаётся активной или пока это необходимо для работы Платформы. К базе данных применяются средства контроля доступа; тем не менее ни один онлайн-сервис не может быть полностью защищён."
        },
        {
          "h": "7. Изменения",
          "p": "Настоящая Политика может обновляться. При каждом обновлении дата, указанная выше, будет изменяться."
        }
      ],
      "contact": {
        "h": "Контакты",
        "pre": "Вопросы, касающиеся настоящей Политики, можно направить через ",
        "link": "форму обратной связи",
        "post": "."
      }
    }
  },
  "uz": {
    "terms": {
      "title": "Foydalanish shartlari",
      "updated": "So'nggi yangilanish: 2026-yil 15-oktabr. SOURCEX ishchi prototip bo'lib, yopiq beta-sinov rejimida taqdim etiladi.",
      "sections": [
        {
          "h": "1. Xizmatning mohiyati",
          "p": "SOURCEX (keyingi o'rinlarda — «Platforma») — xaridorlar narx taklifi so'rovlarini (keyingi o'rinlarda — «RFQ») joylashtirishi va tasdiqlangan yetkazib beruvchilar ularga javob yuborishi mumkin bo'lgan onlayn xarid platformasi. Platforma faqat foydalanuvchilarni o'zaro tanishtirish vositasi bo'lib xizmat qiladi. SOURCEX xaridor va yetkazib beruvchi o'rtasida tuzilgan hech qanday kelishuvning tarafi emas va ular bo'yicha majburiyat olmaydi."
        },
        {
          "h": "2. Akkauntlar",
          "p": "Foydalanuvchilar to'g'ri va to'liq ma'lumot taqdim etishi hamda kirish ma'lumotlarini sir saqlashi shart. Har bir foydalanuvchi o'z akkaunti orqali amalga oshirilgan barcha harakatlar uchun javobgar. SOURCEX ushbu Shartlarni buzgan yoki Platformadan suiiste'mol qilish uchun foydalanilgan har qanday akkauntni to'xtatib qo'yish yoki o'chirish huquqiga ega."
        },
        {
          "h": "3. Xaridorlar",
          "p": "Xaridorlar RFQ'larni faqat haqiqiy xarid ehtiyoji mavjud bo'lganda joylashtirishi shart. Chalg'ituvchi, noqonuniy yoki talab qilinmagan (spam) so'rovlarni joylashtirish taqiqlanadi."
        },
        {
          "h": "4. Yetkazib beruvchilar",
          "p": "Yetkazib beruvchi Platformada faqat arizasi ko'rib chiqilib, tasdiqlangandan keyingina ro'yxatga kiritiladi. Yetkazib beruvchilar kompaniya haqida haqqoniy va to'g'ri ma'lumot taqdim etishi shart. Profilning asosiy ma'lumotlari, masalan, mahsulot toifalari o'zgartirilsa, qayta tekshiruv talab qilinishi mumkin. SOURCEX o'z ixtiyoriga ko'ra istalgan yetkazib beruvchini rad etishi, to'xtatib qo'yishi yoki olib tashlashi mumkin."
        },
        {
          "h": "5. Takliflar va bitimlar",
          "p": "Takliflar, narxlar, tayyorlash muddatlari va mahsulot sifati uchun faqat yetkazib beruvchi javobgar. Xaridorlar va yetkazib beruvchilar o'zaro kelishuvlari, to'lovlari, yetkazib berish va amaldagi qonunchilikka rioya qilish uchun mustaqil ravishda javobgar. SOURCEX hech bir yetkazib beruvchi yoki xaridorning xatti-harakatini, shuningdek hech qanday bitim natijasini kafolatlamaydi."
        },
        {
          "h": "6. Ruxsat etilgan foydalanish",
          "p": "Foydalanuvchilarga quyidagilar taqiqlanadi:",
          "ul": [
            "yolg'on, chalg'ituvchi yoki firibgarlik xarakteridagi ma'lumotlarni taqdim etish;",
            "Platforma ishiga xalaqit berish, uni ortiqcha yuklash yoki undan ma'lumotlarni avtomatik yig'ishga urinish;",
            "ta'qib qilish yoki noqonuniy kontent joylashtirish."
          ]
        },
        {
          "h": "7. Kafolatlardan voz kechish va javobgarlikni cheklash",
          "p": "Yopiq beta-sinov davrida Platforma «bor holicha» va «mavjudligicha» taqdim etiladi. U istalgan vaqtda o'zgartirilishi, to'xtatilishi yoki yopilishi mumkin. Amaldagi qonunchilik ruxsat bergan doirada SOURCEX Platformadan foydalanish natijasida yuzaga kelgan zararlar uchun javobgar emas."
        },
        {
          "h": "8. O'zgartirishlar",
          "p": "SOURCEX ushbu Shartlarni vaqti-vaqti bilan o'zgartirishi mumkin. O'zgartirishlardan keyin Platformadan foydalanishni davom ettirish yangi tahrirni qabul qilganlikni anglatadi."
        }
      ],
      "contact": {
        "h": "Aloqa",
        "pre": "Ushbu Shartlarga oid savollarni ",
        "link": "aloqa shakli",
        "post": " orqali yuborish mumkin."
      }
    },
    "privacy": {
      "title": "Maxfiylik siyosati",
      "updated": "So'nggi yangilanish: 2026-yil 15-oktabr. SOURCEX ishchi prototip bo'lib, yopiq beta-sinov rejimida taqdim etiladi.",
      "sections": [
        {
          "h": "1. Biz to'playdigan shaxsiy ma'lumotlar",
          "ul": [
            {
              "b": "Akkaunt ma'lumotlari:",
              "t": "elektron pochta manzili va parol. Parollar autentifikatsiya provayderimiz tomonidan qayta ishlanadi va SOURCEX uchun ochiq emas."
            },
            {
              "b": "RFQ'lar:",
              "t": "foydalanuvchi kiritgan mahsulot, miqdor, toifa, muddat va aloqa ma'lumotlari."
            },
            {
              "b": "Yetkazib beruvchi arizalari:",
              "t": "kompaniya nomi, mahsulot toifalari, aloqa ma'lumotlari va ariza beruvchi taqdim etgan boshqa ma'lumotlar."
            },
            {
              "b": "Xabarlar:",
              "t": "aloqa shakli yoki so'rov shakli orqali yuborilgan ism, elektron pochta manzili va xabar matni."
            },
            {
              "b": "Kutish ro'yxati:",
              "t": "foydalanuvchi kutish ro'yxatiga qo'shilgan taqdirda uning elektron pochta manzili."
            }
          ]
        },
        {
          "h": "2. Qayta ishlash maqsadlari",
          "p": "Ma'lumotlar akkauntlarni yuritish, RFQ va takliflarni ko'rsatish, yetkazib beruvchi arizalarini ko'rib chiqish, xabarlarga javob berish va Platforma xavfsizligini ta'minlash uchun ishlatiladi. SOURCEX shaxsiy ma'lumotlarni sotmaydi."
        },
        {
          "h": "3. Ma'lumotlarga kirish",
          "p": "Ma'lumotlarga quyidagilar kirishi mumkin:",
          "ul": [
            "SOURCEX ma'murlari;",
            "tasdiqlangan yetkazib beruvchilar — ular o'z mahsulot toifalariga mos ochiq RFQ'larni ko'radi;",
            "Platforma ishini ta'minlovchi xizmat ko'rsatuvchilar: Supabase (ma'lumotlar bazasi va autentifikatsiya hostingi) va Vercel (veb-sayt hostingi)."
          ]
        },
        {
          "h": "4. Cookie fayllar va mahalliy xotira",
          "p": "Brauzer xotirasi foydalanuvchining tizimga kirgan holatini saqlash, tanlangan interfeys tilini eslab qolish va ko'rilgan xabarnomalarni belgilash uchun ishlatiladi. Kirish shaklida CAPTCHA himoyasi yoqilgan bo'lsa, uning provayderi (Cloudflare Turnstile) avtomatlashtirilgan trafikni aniqlash uchun texnik ma'lumotlarni qayta ishlashi mumkin."
        },
        {
          "h": "5. Foydalanuvchi huquqlari",
          "p": "Foydalanuvchi istalgan vaqtda aloqa shakli orqali akkaunti va ma'lumotlarini tuzatish yoki o'chirishni so'rashi mumkin. SOURCEX asosli so'rovlarni ko'rib chiqadi va ular bo'yicha harakat qiladi."
        },
        {
          "h": "6. Saqlash va xavfsizlik",
          "p": "Ma'lumotlar akkaunt faol bo'lgan davrda yoki Platforma ishini ta'minlash uchun zarur bo'lgan muddat davomida saqlanadi. Ma'lumotlar bazasida kirishni nazorat qilish choralari qo'llanadi; biroq hech bir onlayn xizmat to'liq xavfsiz bo'la olmaydi."
        },
        {
          "h": "7. O'zgartirishlar",
          "p": "Ushbu Siyosat yangilanishi mumkin. Har bir yangilanishda yuqorida ko'rsatilgan sana o'zgartiriladi."
        }
      ],
      "contact": {
        "h": "Aloqa",
        "pre": "Ushbu Siyosatga oid savollarni ",
        "link": "aloqa shakli",
        "post": " orqali yuborish mumkin."
      }
    }
  },
  "zh": {
    "terms": {
      "title": "服务条款",
      "updated": "最后更新日期：2026 年 10 月 15 日。SOURCEX 为运行中的原型产品，目前处于内部测试阶段。",
      "sections": [
        {
          "h": "1. 服务性质",
          "p": "SOURCEX（以下简称“平台”）是一个线上采购平台，买家可在其中发布询价单（以下简称“RFQ”），经审核通过的供应商可提交回复。平台仅作为用户之间的引荐渠道。SOURCEX 不是买家与供应商之间任何协议的当事方，亦不就该等协议承担任何义务。"
        },
        {
          "h": "2. 账号",
          "p": "用户应提供真实、完整的信息，并妥善保管其登录凭证。用户应对其账号下发生的一切行为负责。对于违反本条款或被用于滥用平台的账号，SOURCEX 有权暂停或删除。"
        },
        {
          "h": "3. 买家",
          "p": "买家仅可就真实的采购需求发布 RFQ。禁止发布具有误导性、违法或垃圾性质的询价。"
        },
        {
          "h": "4. 供应商",
          "p": "供应商须在其申请经审核并获批后，方可在平台上展示。供应商应提供真实、准确的公司信息。变更关键资料（例如产品品类）可能需要重新审核。SOURCEX 有权自行决定拒绝、暂停或移除任何供应商。"
        },
        {
          "h": "5. 报价与交易",
          "p": "报价、价格、交期及产品质量由供应商独立负责。买家与供应商应各自对其协议、付款、运输以及遵守适用法律负责。SOURCEX 不对任何供应商或买家的行为，亦不对任何交易的结果作出保证。"
        },
        {
          "h": "6. 可接受的使用",
          "p": "用户不得：",
          "ul": [
            "提供虚假、误导性或欺诈性的信息；",
            "试图破坏平台、使平台过载或抓取平台数据；",
            "实施骚扰或发布违法内容。"
          ]
        },
        {
          "h": "7. 免责声明与责任限制",
          "p": "在内部测试期间，平台按“现状”和“可用状态”提供。平台可能随时被修改、中断或关闭。在适用法律允许的范围内，SOURCEX 对因使用平台而产生的任何损失不承担责任。"
        },
        {
          "h": "8. 条款变更",
          "p": "SOURCEX 可不时修订本条款。修订后继续使用平台，即表示您接受修订后的条款。"
        }
      ],
      "contact": {
        "h": "联系方式",
        "pre": "有关本条款的问题，可通过",
        "link": "联系表单",
        "post": "提交。"
      }
    },
    "privacy": {
      "title": "隐私政策",
      "updated": "最后更新日期：2026 年 10 月 15 日。SOURCEX 为运行中的原型产品，目前处于内部测试阶段。",
      "sections": [
        {
          "h": "1. 我们收集的个人数据",
          "ul": [
            {
              "b": "账号数据：",
              "t": "电子邮箱地址和密码。密码由我们的身份验证服务提供商处理，SOURCEX 无法读取。"
            },
            {
              "b": "RFQ：",
              "t": "用户填写的产品、数量、品类、截止日期和联系方式。"
            },
            {
              "b": "供应商申请：",
              "t": "公司名称、产品品类、联系方式以及申请人提交的其他信息。"
            },
            {
              "b": "消息：",
              "t": "通过联系表单或咨询表单提交的姓名、电子邮箱地址和留言内容。"
            },
            {
              "b": "候补名单：",
              "t": "用户加入候补名单时提供的电子邮箱地址。"
            }
          ]
        },
        {
          "h": "2. 处理目的",
          "p": "数据用于运营用户账号、展示 RFQ 和报价、审核供应商申请、回复消息以及维护平台安全。SOURCEX 不出售个人数据。"
        },
        {
          "h": "3. 数据访问",
          "p": "以下主体可以访问数据：",
          "ul": [
            "SOURCEX 管理员；",
            "经审核通过的供应商，可查看与其产品品类匹配的开放 RFQ；",
            "运营平台的服务提供商：Supabase（数据库与身份验证托管）和 Vercel（网站托管）。"
          ]
        },
        {
          "h": "4. Cookie 与本地存储",
          "p": "浏览器存储用于保持用户的登录状态、记住所选界面语言以及标记已查看的通知。如登录表单启用了 CAPTCHA 保护，其提供商（Cloudflare Turnstile）可能会处理技术数据，以识别自动化流量。"
        },
        {
          "h": "5. 用户权利",
          "p": "用户可随时通过联系表单要求更正或删除其账号和数据。SOURCEX 将处理合理的请求。"
        },
        {
          "h": "6. 存储期限与安全",
          "p": "数据在账号保持有效期间，或为运营平台所必需的期间内保存。数据库采用了访问控制措施；但任何在线服务均无法保证绝对安全。"
        },
        {
          "h": "7. 政策变更",
          "p": "本政策可能会更新。每次更新时，上方日期将相应修改。"
        }
      ],
      "contact": {
        "h": "联系方式",
        "pre": "有关本政策的问题，可通过",
        "link": "联系表单",
        "post": "提交。"
      }
    }
  }
};
