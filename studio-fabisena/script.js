"use strict";

const service = document.getElementById("service");
const date = document.getElementById("date");
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");

const times = document.querySelectorAll(".time");

const customTimeContainer =
    document.getElementById("customTimeContainer");

const customTime =
    document.getElementById("customTime");

const availability =
    document.getElementById("availability");

const bookButton =
    document.getElementById("bookButton");

const message =
    document.getElementById("message");

const website =
    document.getElementById("website");


let selectedTime = null;
let occupiedTimes = [];


/*
 * Data mínima = hoje
 */
function getToday() {

    const now = new Date();

    const year = now.getFullYear();

    const month =
        String(now.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(now.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


date.min = getToday();


/*
 * Mensagens
 */
function showMessage(text, type = "error") {

    message.textContent = text;

    message.className =
        `message show ${type}`;
}


/*
 * Limpa mensagens
 */
function clearMessage() {

    message.textContent = "";

    message.className = "message";
}


/*
 * Selecionar horário
 */
times.forEach(button => {

    button.addEventListener("click", () => {

        if (
            button.disabled ||
            button.classList.contains("unavailable")
        ) {
            return;
        }

        times.forEach(item => {
            item.classList.remove("selected");
        });

        button.classList.add("selected");

        selectedTime =
            button.dataset.time;

        if (selectedTime === "OUTRO") {

            customTimeContainer
                .classList
                .remove("hidden");

        } else {

            customTimeContainer
                .classList
                .add("hidden");

            customTime.value = "";
        }

        clearMessage();
    });

});


/*
 * Busca disponibilidade
 */
async function loadAvailability() {

    if (!date.value) {

        availability.textContent =
            "Selecione uma data.";

        return;
    }

    availability.textContent =
        "Verificando disponibilidade...";

    times.forEach(button => {

        button.disabled = false;

        button.classList.remove(
            "unavailable",
            "selected"
        );
    });

    selectedTime = null;

    customTimeContainer
        .classList
        .add("hidden");

    try {

        const response =
            await fetch(
                `/api/availability?date=${encodeURIComponent(date.value)}`,
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    },
                    cache: "no-store"
                }
            );

        if (!response.ok) {
            throw new Error("Falha ao consultar disponibilidade.");
        }

        const data =
            await response.json();

        occupiedTimes =
            Array.isArray(data.occupied)
                ? data.occupied
                : [];


        let availableCount = 0;


        times.forEach(button => {

            const time =
                button.dataset.time;

            if (time === "OUTRO") {
                return;
            }

            if (occupiedTimes.includes(time)) {

                button.disabled = true;

                button.classList.add(
                    "unavailable"
                );

            } else {

                availableCount++;
            }

        });


        if (availableCount === 0) {

            availability.textContent =
                "Os horários principais deste dia estão preenchidos. Você pode solicitar outro horário.";

        } else {

            availability.textContent =
                `${availableCount} horário(s) disponível(is).`;

        }

    } catch (error) {

        console.error(error);

        availability.textContent =
            "Não foi possível consultar os horários. Tente novamente.";
    }
}


date.addEventListener(
    "change",
    loadAvailability
);


/*
 * Telefone
 */
phoneInput.addEventListener(
    "input",
    () => {

        phoneInput.value =
            phoneInput.value
                .replace(/[^\d+()\-\s]/g, "")
                .slice(0, 20);
    }
);


/*
 * Nome
 */
nameInput.addEventListener(
    "input",
    () => {

        nameInput.value =
            nameInput.value
                .replace(/[\u0000-\u001F\u007F]/g, "")
                .slice(0, 80);
    }
);


/*
 * Agendamento
 */
bookButton.addEventListener(
    "click",
    async () => {

        clearMessage();


        /*
         * Honeypot
         */
        if (website.value.trim() !== "") {

            showMessage(
                "Não foi possível realizar o agendamento."
            );

            return;
        }


        const selectedService =
            service.value.trim();

        const selectedDate =
            date.value.trim();

        const customerName =
            nameInput.value.trim();

        const customerPhone =
            phoneInput.value.trim();


        /*
         * Validação básica
         */
        if (!selectedService) {

            showMessage(
                "Escolha um serviço."
            );

            return;
        }


        if (!selectedDate) {

            showMessage(
                "Escolha uma data."
            );

            return;
        }


        if (!selectedTime) {

            showMessage(
                "Escolha um horário."
            );

            return;
        }


        let finalTime =
            selectedTime;


        if (selectedTime === "OUTRO") {

            finalTime =
                customTime.value.trim();

            if (!finalTime) {

                showMessage(
                    "Informe o horário desejado."
                );

                return;
            }
        }


        if (customerName.length < 2) {

            showMessage(
                "Digite seu nome completo."
            );

            return;
        }


        const phoneDigits =
            customerPhone.replace(/\D/g, "");


        if (
            phoneDigits.length < 10 ||
            phoneDigits.length > 13
        ) {

            showMessage(
                "Digite um WhatsApp válido."
            );

            return;
        }


        /*
         * Confirma data
         */
        if (
            selectedDate <
            getToday()
        ) {

            showMessage(
                "Não é possível escolher uma data passada."
            );

            return;
        }


        /*
         * Bloqueia horário já ocupado
         */
        if (
            selectedTime !== "OUTRO" &&
            occupiedTimes.includes(finalTime)
        ) {

            showMessage(
                "Esse horário acabou de ser ocupado. Atualize a página e escolha outro."
            );

            await loadAvailability();

            return;
        }


        bookButton.disabled = true;

        bookButton.textContent =
            "Enviando...";


        try {

            const response =
                await fetch(
                    "/api/book",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"
                        },

                        body: JSON.stringify({

                            service:
                                selectedService,

                            date:
                                selectedDate,

                            time:
                                finalTime,

                            name:
                                customerName,

                            phone:
                                customerPhone,

                            customTime:
                                selectedTime === "OUTRO"
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Não foi possível realizar o agendamento."
                );
            }


            showMessage(
                "Agendamento registrado! Você será direcionada ao WhatsApp para aguardar a confirmação da Fabi.",
                "success"
            );


            /*
             * O número da Fabi nunca esteve no JavaScript público.
             * O servidor retorna o redirecionamento.
             */
            if (data.whatsappUrl) {

                setTimeout(() => {

                    window.location.href =
                        data.whatsappUrl;

                }, 500);
            }


        } catch (error) {

            console.error(error);

            showMessage(
                error.message ||
                "Erro ao realizar o agendamento."
            );

        } finally {

            bookButton.disabled = false;

            bookButton.textContent =
                "Agendar pelo WhatsApp";
        }

    }
);
