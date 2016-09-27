library(shiny)
library(shinyBS)
library(ggplot2)
library(shinyProc)

flog.threshold(DEBUG)

ui <- fluidPage(
   
   titlePanel("Titles for plot"),
   plotTitlesUI(id = "PlotTitle"),
   sidebarLayout(
      sidebarPanel(
      ),
      
      mainPanel(
         plotOutput("plot", dblclick = "spTitle")
      )
   )
)

server <- function(input, output, session) {
   
  
  titles = callModule(makePlotTitles, "PlotTitle")
  
  observe({ 
    req(input$spTitle)
    req(titles$modalId)
    toggleModal(session, titles$modalId)
  })
  
  output$plot = renderPlot({
     p = qplot(mpg, wt, data = mtcars, colour = I("red"))
     titles$call(p) 
  })
 
}

shinyApp(ui = ui, server = server)

